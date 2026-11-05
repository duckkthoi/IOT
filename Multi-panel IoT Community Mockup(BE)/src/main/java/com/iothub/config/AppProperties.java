package com.iothub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.time.ZoneId;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String timezone,
        String frontendUrl,
        String backendUrl,
        Cors cors,
        Jwt jwt,
        Duration passwordResetTtl,
        String mailFrom,
        Admin admin,
        Sensor sensor,
        Device device,
        Simulator simulator,
        OAuth oauth
) {
    public ZoneId zone() {
        return ZoneId.of(timezone);
    }

    public record Cors(List<String> allowedOrigins) {}

    public record Jwt(String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {}

    public record Admin(String username, String password, String fullName, String email, String studentCode) {}

    public record Sensor(Duration offlineAfter) {}

    public record Device(Duration responseTimeout, boolean waitForResponse) {}

    public record Simulator(boolean enabled, long intervalMs) {}

    public record OAuth(Provider google, Provider github) {}

    public record Provider(String clientId, String clientSecret) {
        public boolean configured() {
            return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
        }
    }
}
