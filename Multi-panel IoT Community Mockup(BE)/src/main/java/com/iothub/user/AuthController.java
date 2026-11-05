package com.iothub.user;

import com.iothub.common.ApiException;
import com.iothub.config.AppProperties;
import com.iothub.security.AuthUser;
import com.iothub.security.CurrentUser;
import com.iothub.user.AuthDtos.ForgotPasswordRequest;
import com.iothub.user.AuthDtos.LoginRequest;
import com.iothub.user.AuthDtos.LoginResponse;
import com.iothub.user.AuthDtos.MessageResponse;
import com.iothub.user.AuthDtos.RefreshRequest;
import com.iothub.user.AuthDtos.RegisterRequest;
import com.iothub.user.AuthDtos.RegisterResponse;
import com.iothub.user.AuthDtos.ResetPasswordRequest;
import com.iothub.user.AuthDtos.UserView;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/** Nhom API Xac thuc - SRS B.2 (UC0). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService auth;
    private final OAuthService oauth;
    private final AppProperties props;

    public AuthController(AuthService auth, OAuthService oauth, AppProperties props) {
        this.auth = auth;
        this.oauth = oauth;
        this.props = props;
    }

    /** B.2.1 */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        User u = auth.register(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse(true, "Đăng ký tài khoản thành công", u.getUserId()));
    }

    /** B.2.2 */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    /** Mo rong: doi refresh_token (remember_me) lay access token moi. */
    @PostMapping("/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return auth.refresh(req.refreshToken());
    }

    /** Mo rong: thu hoi refresh_token khi dang xuat. */
    @PostMapping("/logout")
    public MessageResponse logout(@RequestBody(required = false) Map<String, String> body) {
        auth.logout(body == null ? null : body.get("refresh_token"));
        return MessageResponse.ok("Đã đăng xuất");
    }

    /** B.2.3 - luon tra cung mot thong bao. */
    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        auth.forgotPassword(req.email());
        return MessageResponse.ok("Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi");
    }

    /** Mo rong: hoan tat dat lai mat khau bang token trong email. */
    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        auth.resetPassword(req);
        return MessageResponse.ok("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
    }

    /** Thong tin nguoi dung dang dang nhap. */
    @GetMapping("/me")
    public Map<String, Object> me(@CurrentUser AuthUser user) {
        return Map.of("success", true, "user", UserView.of(auth.requireUser(user.userId())));
    }

    /** B.2.4 - chuyen huong sang trang dang nhap cua Google / GitHub. */
    @GetMapping("/oauth/{provider}")
    public ResponseEntity<Void> oauthRedirect(@PathVariable String provider) {
        return redirect(oauth.authorizationUrl(provider));
    }

    /**
     * Callback tu nha cung cap. Tao/lien ket tai khoan, phat hanh token roi chuyen ve Frontend:
     * {frontend-url}/oauth/callback#token=...&refresh_token=...  (hoac #error=...).
     */
    @GetMapping("/oauth/{provider}/callback")
    public ResponseEntity<Void> oauthCallback(@PathVariable String provider,
                                              @RequestParam(required = false) String code,
                                              @RequestParam(required = false) String state,
                                              @RequestParam(required = false) String error) {
        String target = props.frontendUrl() + "/oauth/callback";
        if (error != null) {
            return redirect(target + "#error=" + enc("Người dùng đã huỷ đăng nhập " + provider));
        }
        try {
            User u = oauth.handleCallback(provider, code, state);
            LoginResponse tokens = auth.issueTokens(u, true);
            return redirect(target + "#token=" + enc(tokens.token()) + "&refresh_token=" + enc(tokens.refreshToken()));
        } catch (ApiException e) {
            return redirect(target + "#error=" + enc(e.getMessage()));
        } catch (Exception e) {
            log.error("OAuth {} that bai", provider, e);
            return redirect(target + "#error=" + enc("Đăng nhập " + provider + " thất bại"));
        }
    }

    private static ResponseEntity<Void> redirect(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(url));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }
}
