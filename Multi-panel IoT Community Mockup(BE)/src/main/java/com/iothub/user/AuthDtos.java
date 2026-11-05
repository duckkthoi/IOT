package com.iothub.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response cua nhom API xac thuc (SRS B.2) va thong tin ca nhan. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Họ và tên không được để trống")
            @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
            String fullName,
            @NotBlank(message = "Tên đăng nhập không được để trống")
            @Size(min = 3, max = 50, message = "Tên đăng nhập dài 3-50 ký tự")
            @Pattern(regexp = "^[A-Za-z0-9_.]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu chấm và gạch dưới")
            String username,
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            @Size(max = 100, message = "Email tối đa 100 ký tự")
            String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 6, max = 72, message = "Mật khẩu dài 6-72 ký tự")
            String password,
            @NotBlank(message = "Vui lòng xác nhận mật khẩu")
            String confirmPassword
    ) {}

    public record RegisterResponse(boolean success, String message, Integer userId) {}

    public record LoginRequest(
            @NotBlank(message = "Vui lòng nhập email hoặc tên đăng nhập") String identifier,
            @NotBlank(message = "Vui lòng nhập mật khẩu") String password,
            Boolean rememberMe
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record LoginResponse(
            boolean success,
            String token,
            String tokenType,
            long expiresIn,
            String refreshToken,
            UserView user
    ) {}

    public record RefreshRequest(@NotBlank(message = "Thiếu refresh_token") String refreshToken) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank(message = "Thiếu token") String token,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 6, max = 72, message = "Mật khẩu dài 6-72 ký tự") String password,
            @NotBlank(message = "Vui lòng xác nhận mật khẩu") String confirmPassword
    ) {}

    public record UpdateProfileRequest(
            @Size(max = 100, message = "Họ và tên tối đa 100 ký tự") String fullName,
            @Email(message = "Email không hợp lệ") @Size(max = 100) String email,
            @Size(max = 20, message = "Mã sinh viên tối đa 20 ký tự") String studentCode,
            @Size(max = 255) String avatarUrl
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại") String currentPassword,
            @NotBlank(message = "Mật khẩu mới không được để trống")
            @Size(min = 6, max = 72, message = "Mật khẩu dài 6-72 ký tự") String newPassword,
            @NotBlank(message = "Vui lòng xác nhận mật khẩu") String confirmPassword
    ) {}

    /** Admin cap quyen / khoa tai khoan. */
    public record AdminUpdateUserRequest(Role role, com.iothub.common.ActiveStatus status) {}

    public record MessageResponse(boolean success, String message) {
        public static MessageResponse ok(String message) {
            return new MessageResponse(true, message);
        }
    }

    public record UserView(
            Integer userId,
            String username,
            String fullName,
            String email,
            String studentCode,
            String avatarUrl,
            String role,
            String status,
            String oauthProvider,
            java.time.Instant createdAt
    ) {
        public static UserView of(User u) {
            return new UserView(u.getUserId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getStudentCode(),
                    u.getAvatarUrl(), u.getRole().name(), u.getStatus().name(), u.getOauthProvider(), u.getCreatedAt());
        }
    }
}
