package com.iothub.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/** Swagger UI tai /swagger-ui.html - nhan "Authorize" va dan token tu /api/auth/login. */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI iotHubOpenApi(AppProperties props) {
        return new OpenAPI()
                .info(new Info().title("IoT Community Hub API").version("1.0.0")
                        .description("RESTful API theo SRS Phu luc B. MQTT topics: sensor_data, device_control, device_response."))
                .servers(List.of(new Server().url(props.backendUrl())))
                .components(new Components().addSecuritySchemes("bearer",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer"));
    }
}
