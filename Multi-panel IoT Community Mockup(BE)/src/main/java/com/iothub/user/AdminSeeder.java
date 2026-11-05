package com.iothub.user;

import com.iothub.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Tao tai khoan quan tri vien mac dinh neu DB chua co admin nao (cau hinh app.admin.*). */
@Component
@Order(1)
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.countByRole(Role.admin) > 0) return;
        AppProperties.Admin a = props.admin();
        if (users.existsByUsernameIgnoreCase(a.username())) {
            log.warn("Chua co admin nhung username '{}' da ton tai - bo qua tao admin mac dinh", a.username());
            return;
        }
        User u = new User();
        u.setUsername(a.username());
        u.setPasswordHash(encoder.encode(a.password()));
        u.setFullName(a.fullName());
        u.setEmail(a.email() == null || users.existsByEmailIgnoreCase(a.email()) ? null : a.email());
        u.setStudentCode(a.studentCode());
        u.setRole(Role.admin);
        users.save(u);
        log.info("Da tao tai khoan admin mac dinh: username='{}' (hay doi mat khau sau khi dang nhap)", a.username());
    }
}
