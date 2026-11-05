package com.iothub.user;

import com.iothub.common.ApiException;
import com.iothub.security.AuthUser;
import com.iothub.security.CurrentUser;
import com.iothub.user.AuthDtos.AdminUpdateUserRequest;
import com.iothub.user.AuthDtos.ChangePasswordRequest;
import com.iothub.user.AuthDtos.MessageResponse;
import com.iothub.user.AuthDtos.UpdateProfileRequest;
import com.iothub.user.AuthDtos.UserView;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Trang "Thong tin ca nhan" + quan ly tai khoan cho admin (mo rong ngoai SRS). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService auth;
    private final UserRepository users;

    public UserController(AuthService auth, UserRepository users) {
        this.auth = auth;
        this.users = users;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@CurrentUser AuthUser user) {
        return Map.of("success", true, "user", UserView.of(auth.requireUser(user.userId())));
    }

    @PutMapping("/me")
    public Map<String, Object> updateMe(@CurrentUser AuthUser user, @Valid @RequestBody UpdateProfileRequest req) {
        return Map.of("success", true, "user", UserView.of(auth.updateProfile(user.userId(), req)));
    }

    @PutMapping("/me/password")
    public MessageResponse changePassword(@CurrentUser AuthUser user, @Valid @RequestBody ChangePasswordRequest req) {
        auth.changePassword(user.userId(), req);
        return MessageResponse.ok("Đổi mật khẩu thành công");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> list() {
        List<UserView> data = users.findAll(Sort.by("userId")).stream().map(UserView::of).toList();
        return Map.of("success", true, "total", data.size(), "data", data);
    }

    /** Nang quyen admin / khoa tai khoan (SRS: "viec nang quyen admin do quan tri vien thuc hien"). */
    @PatchMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> adminUpdate(@CurrentUser AuthUser admin, @PathVariable Integer userId,
                                           @RequestBody AdminUpdateUserRequest req) {
        User u = auth.requireUser(userId);
        if (userId.equals(admin.userId()) && (req.role() == Role.user || req.status() == com.iothub.common.ActiveStatus.inactive)) {
            throw ApiException.badRequest("Không thể tự hạ quyền hoặc khoá tài khoản của chính mình");
        }
        if (req.role() != null) u.setRole(req.role());
        if (req.status() != null) u.setStatus(req.status());
        return Map.of("success", true, "user", UserView.of(users.save(u)));
    }
}
