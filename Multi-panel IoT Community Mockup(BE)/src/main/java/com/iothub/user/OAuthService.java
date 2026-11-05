package com.iothub.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.iothub.common.ApiException;
import com.iothub.config.AppProperties;
import com.iothub.security.JwtService;
import com.iothub.security.TokenHasher;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Locale;

/**
 * Dang nhap nhanh qua Google / GitHub theo OAuth 2.0 Authorization Code (SRS B.2.4).
 * Can khai bao GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET; redirect URI dang ky voi nha cung cap:
 * {app.backend-url}/api/auth/oauth/{provider}/callback
 */
@Service
public class OAuthService {

    public record OAuthProfile(String provider, String id, String email, String name, String login, String avatarUrl) {}

    private final AppProperties props;
    private final JwtService jwt;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final RestClient http = RestClient.create();

    public OAuthService(AppProperties props, JwtService jwt, UserRepository users, PasswordEncoder encoder) {
        this.props = props;
        this.jwt = jwt;
        this.users = users;
        this.encoder = encoder;
    }

    public String authorizationUrl(String provider) {
        AppProperties.Provider cfg = config(provider);
        String state = jwt.issueOAuthState(provider);
        return switch (provider) {
            case "google" -> UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                    .queryParam("client_id", cfg.clientId())
                    .queryParam("redirect_uri", redirectUri(provider))
                    .queryParam("response_type", "code")
                    .queryParam("scope", "openid email profile")
                    .queryParam("state", state)
                    .queryParam("prompt", "select_account")
                    .encode().toUriString();
            case "github" -> UriComponentsBuilder.fromUriString("https://github.com/login/oauth/authorize")
                    .queryParam("client_id", cfg.clientId())
                    .queryParam("redirect_uri", redirectUri(provider))
                    .queryParam("scope", "read:user user:email")
                    .queryParam("state", state)
                    .encode().toUriString();
            default -> throw ApiException.badRequest("provider phải là google hoặc github");
        };
    }

    /** Doi code lay thong tin nguoi dung, tao moi hoac lien ket tai khoan trong bang users. */
    @Transactional
    public User handleCallback(String provider, String code, String state) {
        config(provider);
        if (!jwt.verifyOAuthState(state, provider)) {
            throw ApiException.badRequest("Tham số state không hợp lệ hoặc đã hết hạn");
        }
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("Thiếu mã xác thực (code)");
        }
        OAuthProfile profile = "google".equals(provider) ? fetchGoogle(code) : fetchGithub(code);
        return linkOrCreate(profile);
    }

    private OAuthProfile fetchGoogle(String code) {
        AppProperties.Provider cfg = props.oauth().google();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", cfg.clientId());
        form.add("client_secret", cfg.clientSecret());
        form.add("redirect_uri", redirectUri("google"));
        form.add("grant_type", "authorization_code");
        JsonNode token = http.post().uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form).retrieve().body(JsonNode.class);
        String accessToken = text(token, "access_token");
        if (accessToken == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Google không trả về access token");
        JsonNode info = http.get().uri("https://openidconnect.googleapis.com/v1/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve().body(JsonNode.class);
        return new OAuthProfile("google", text(info, "sub"), text(info, "email"), text(info, "name"), null, text(info, "picture"));
    }

    private OAuthProfile fetchGithub(String code) {
        AppProperties.Provider cfg = props.oauth().github();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", cfg.clientId());
        form.add("client_secret", cfg.clientSecret());
        form.add("redirect_uri", redirectUri("github"));
        JsonNode token = http.post().uri("https://github.com/login/oauth/access_token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(form).retrieve().body(JsonNode.class);
        String accessToken = text(token, "access_token");
        if (accessToken == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "GitHub không trả về access token");
        JsonNode info = http.get().uri("https://api.github.com/user")
                .header("Authorization", "Bearer " + accessToken)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve().body(JsonNode.class);
        String email = text(info, "email");
        if (email == null) {
            JsonNode emails = http.get().uri("https://api.github.com/user/emails")
                    .header("Authorization", "Bearer " + accessToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve().body(JsonNode.class);
            if (emails != null && emails.isArray()) {
                for (JsonNode e : emails) {
                    if (e.path("primary").asBoolean() && e.path("verified").asBoolean()) {
                        email = text(e, "email");
                    }
                }
            }
        }
        return new OAuthProfile("github", text(info, "id"), email, text(info, "name"), text(info, "login"), text(info, "avatar_url"));
    }

    private User linkOrCreate(OAuthProfile p) {
        if (p.id() == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Không lấy được thông tin tài khoản từ " + p.provider());
        User user = users.findByOauthProviderAndOauthId(p.provider(), p.id())
                .or(() -> p.email() == null ? java.util.Optional.empty() : users.findByEmailIgnoreCase(p.email()))
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername(uniqueUsername(p));
                    u.setFullName(p.name() != null && !p.name().isBlank() ? p.name() : (p.login() != null ? p.login() : "Người dùng"));
                    u.setEmail(p.email() == null ? null : p.email().toLowerCase(Locale.ROOT));
                    // password_hash NOT NULL: dat mat khau ngau nhien (dang nhap bang OAuth hoac dung "quen mat khau")
                    u.setPasswordHash(encoder.encode(TokenHasher.newToken()));
                    u.setRole(Role.user);
                    return u;
                });
        if (!user.isActive() && user.getUserId() != null) {
            throw ApiException.forbidden("Tài khoản đã bị vô hiệu hoá");
        }
        user.setOauthProvider(p.provider());
        user.setOauthId(p.id());
        if (user.getAvatarUrl() == null) user.setAvatarUrl(p.avatarUrl());
        return users.save(user);
    }

    private String uniqueUsername(OAuthProfile p) {
        String base = p.login() != null ? p.login()
                : p.email() != null ? p.email().substring(0, p.email().indexOf('@'))
                : p.provider() + "_user";
        base = base.replaceAll("[^A-Za-z0-9_.]", "").toLowerCase(Locale.ROOT);
        if (base.length() < 3) base = p.provider() + "_" + base;
        if (base.length() > 40) base = base.substring(0, 40);
        String candidate = base;
        for (int i = 1; users.existsByUsernameIgnoreCase(candidate); i++) {
            candidate = base + i;
        }
        return candidate;
    }

    private AppProperties.Provider config(String provider) {
        AppProperties.Provider cfg = switch (provider) {
            case "google" -> props.oauth().google();
            case "github" -> props.oauth().github();
            default -> throw ApiException.badRequest("provider phải là google hoặc github");
        };
        if (cfg == null || !cfg.configured()) {
            throw new ApiException(HttpStatus.NOT_IMPLEMENTED,
                    "Chưa cấu hình đăng nhập " + provider + " (thiếu client id/secret)");
        }
        return cfg;
    }

    private String redirectUri(String provider) {
        return props.backendUrl() + "/api/auth/oauth/" + provider + "/callback";
    }

    private static String text(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
