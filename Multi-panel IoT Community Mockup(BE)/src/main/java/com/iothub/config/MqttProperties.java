package com.iothub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "mqtt")
public record MqttProperties(
        boolean enabled,
        String brokerUrl,
        String username,
        String password,
        String clientId,
        int qos,
        Duration reconnectInterval,
        Topics topics
) {
    public record Topics(String sensorData, String deviceControl, String deviceResponse) {}
}
