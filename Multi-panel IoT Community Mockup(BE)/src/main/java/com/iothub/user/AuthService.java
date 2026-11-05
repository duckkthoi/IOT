package com.iothub.user;

import com.iothub.common.ApiException;
import com.iothub.config.AppProperties;
import com.iothub.security.JwtService;
import com.iothub.security.TokenHasher;
import com.iothub.user.AuthDtos.ChangePasswordRequest;
import com.iothub.user.AuthDtos.LoginRequest;
import com.iothub.user.AuthDtos.LoginResponse;
import com.iothub.user.AuthDtos.RegisterRequest;
import com.iothub.user.AuthDtos.ResetPasswordRequest;
import com.iothub.user.AuthDtos.UpdateProfileRequest;
import com.iothub.user.AuthDtos.UserView;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final MailService mail;
    private final AppProperties props;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens,
                       PasswordResetTokenRepository resetTokens, PasswordEncoder encoder, JwtService jwt,
                       MailService mail, AppProperties props) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.mail = mail;
        this.props = props;
    }

    /** B.2.1 - tai khoan moi: role = 'user', status = 'active'. */
    @Transactional
    public User register(RegisterRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw ApiException.badRequest("Mật khẩu xác nhận không khớp");
        }
        String username = req.username().trim();
        String email = req.email().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username) || users.existsByEmailIgnoreCase(email)) {
            throw ApiException.badRequest("Email hoặc tên đăng nhập đã được sử dụng");
        }
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setFullName(req.fullName().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole(Role.user);
        return users.save(u);
    }

    /** B.2.2 - identifier la email hoac username; remember_me -> them refresh_token 30 ngay. */
    @Transactional
    public LoginResponse login(LoginRequest req) {
        User u = users.findByIdentifier(req.identifier().trim())
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Sai tài khoản hoặc mật khẩu"));
        if (!u.isActive()) {
            throw ApiException.forbidden("Tài khoản đã bị vô hiệu hoá");
        }
        return issueTokens(u, Boolean.TRUE.equals(req.rememberMe()));
    }

    @Transactional
    public LoginResponse issueTokens(User u, boolean withRefreshToken) {
        String refresh = null;
        if (withRefreshToken) {
            refresh = TokenHasher.newToken();
            refreshTokens.save(new RefreshToken(u.getUserId(), TokenHasher.sha256(refresh),
                    Instant.now().plus(props.jwt().refreshTokenTtl())));
        }
        return new LoginResponse(true, jwt.issueAccessToken(u), "Bearer", jwt.accessTtlSeconds(), refresh, UserView.of(u));
    }

    /** Doi refresh_token lay access token moi (xoay vong: token cu bi thu hoi). */
    @Transactional
    public LoginResponse refresh(String refreshToken) {
        RefreshToken stored = refreshTokens.findByTokenHash(TokenHasher.sha256(refreshToken))
                .filter(RefreshToken::isUsable)
                .orElseThrow(() -> ApiException.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn"));
        User u = users.findById(stored.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> ApiException.unauthorized("Tài khoản không còn hoạt động"));
        stored.revoke();
        return issueTokens(u, true);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        refreshTokens.findByTokenHash(TokenHasher.sha256(refreshToken)).ifPresent(RefreshToken::revoke);
    }

    /**
     * B.2.3 - luon tra thanh cong (khong lo email nao ton tai). Chi gui lien ket khi email hop le.
     */
    @Transactional
    public void forgotPassword(String email) {
        users.findByEmailIgnoreCase(email.trim()).filter(User::isActive).ifPresent(u -> {
            resetTokens.invalidateAllForUser(u.getUserId(), Instant.now());
            String token = TokenHasher.newToken();
            resetTokens.save(new PasswordResetToken(u.getUserId(), TokenHasher.sha256(token),
                    Instant.now().plus(props.passwordResetTtl())));
            String link = props.frontendUrl() + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
            mail.sendPasswordReset(u, link);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        if (!req.password().equals(req.confirmPassword())) {
            throw ApiException.badRequest("Mật khẩu xác nhận không khớp");
        }
        PasswordResetToken t = resetTokens.findByTokenHash(TokenHasher.sha256(req.token().trim()))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));
        User u = users.findById(t.getUserId()).orElseThrow(() -> ApiException.badRequest("Tài khoản không tồn tại"));
        u.setPasswordHash(encoder.encode(req.password()));
        t.markUsed();
        refreshTokens.revokeAllForUser(u.getUserId(), Instant.now());
    }

    public User requireUser(Integer userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng"));
    }

    @Transactional
    public User updateProfile(Integer userId, UpdateProfileRequest req) {
        User u = requireUser(userId);
        if (req.fullName() != null) {
            if (req.fullName().isBlank()) throw ApiException.badRequest("Họ và tên không được để trống");
            u.setFullName(req.fullName().trim());
        }
        if (req.email() != null) {
            String email = req.email().trim().toLowerCase();
            if (email.isEmpty()) {
                u.setEmail(null);
            } else {
                users.findByEmailIgnoreCase(email)
                        .filter(other -> !other.getUserId().equals(userId))
                        .ifPresent(other -> {
                            throw ApiException.badRequest("Email đã được sử dụng");
                        });
                u.setEmail(email);
            }
        }
        if (req.studentCode() != null) u.setStudentCode(blankToNull(req.studentCode()));
        if (req.avatarUrl() != null) u.setAvatarUrl(blankToNull(req.avatarUrl()));
        return u;
    }

    @Transactional
    public void changePassword(Integer userId, ChangePasswordRequest req) {
        User u = requireUser(userId);
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }
        if (!req.newPassword().equals(req.confirmPassword())) {
            throw ApiException.badRequest("Mật khẩu xác nhận không khớp");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
        refreshTokens.revokeAllForUser(userId, Instant.now());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
