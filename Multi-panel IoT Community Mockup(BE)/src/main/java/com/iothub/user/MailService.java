package com.iothub.user;

import com.iothub.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Gui email dat lai mat khau. Neu chua cau hinh SMTP (spring.mail.host) thi chi ghi lien ket ra log
 * de tien thu nghiem tren may ca nhan.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final AppProperties props;

    public MailService(ObjectProvider<JavaMailSender> mailSender, AppProperties props) {
        this.mailSender = mailSender;
        this.props = props;
    }

    @Async
    public void sendPasswordReset(User user, String link) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("[MAIL] Chua cau hinh SMTP. Lien ket dat lai mat khau cho {}: {}", user.getEmail(), link);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(props.mailFrom());
            msg.setTo(user.getEmail());
            msg.setSubject("[IoT Community Hub] Đặt lại mật khẩu");
            msg.setText("Xin chào " + user.getFullName() + ",\n\n"
                    + "Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản " + user.getUsername() + ".\n"
                    + "Nhấn vào liên kết sau trong vòng " + props.passwordResetTtl().toMinutes() + " phút:\n\n"
                    + link + "\n\n"
                    + "Nếu không phải bạn, hãy bỏ qua email này.\n\nIoT Community Hub");
            sender.send(msg);
            log.info("[MAIL] Da gui email dat lai mat khau toi {}", user.getEmail());
        } catch (Exception e) {
            log.error("[MAIL] Gui email that bai toi {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
