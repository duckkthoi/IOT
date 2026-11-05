package com.iothub.security;

import com.iothub.user.Role;
import com.iothub.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

/** Principal cua request da xac thuc (gan vao SecurityContext boi JwtAuthFilter). */
public record AuthUser(Integer userId, String username, String fullName, Role role) {

    public static AuthUser from(User u) {
        return new AuthUser(u.getUserId(), u.getUsername(), u.getFullName(), u.getRole());
    }

    public List<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name().toUpperCase()));
    }

    public boolean isAdmin() {
        return role == Role.admin;
    }
}
