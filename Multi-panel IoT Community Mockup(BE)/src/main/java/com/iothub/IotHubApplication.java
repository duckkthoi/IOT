package com.iothub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * IoT Community Hub - Backend.
 * Kien truc theo SRS: Frontend <-REST-> Backend <-MQTT-> NodeMCU ESP8266, du lieu luu MySQL.
 */
// Xac thuc bang JWT tu bang users -> khong can user mac dinh cua Spring Security
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableScheduling
@EnableAsync
@ConfigurationPropertiesScan
public class IotHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(IotHubApplication.class, args);
    }
}
