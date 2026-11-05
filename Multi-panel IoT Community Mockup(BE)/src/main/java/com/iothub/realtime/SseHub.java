package com.iothub.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Kenh realtime Server-Sent Events (SRS UC1 buoc 5 / muc 4.3).
 * Cac su kien:
 * <ul>
 *   <li>{@code sensor_data}  - co du lieu cam bien moi tu topic sensor_data</li>
 *   <li>{@code device_state} - trang thai LED thay doi (sau device_response)</li>
 *   <li>{@code device_action} - lenh dieu khien moi / doi trang thai xac nhan</li>
 *   <li>{@code mqtt_status}  - ket noi broker thay doi</li>
 * </ul>
 */
@Component
public class SseHub {

    private static final Logger log = LoggerFactory.getLogger(SseHub.class);

    private final Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // khong timeout; heartbeat giu ket noi
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    public void broadcast(String event, Object data) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(event).data(data));
            } catch (Exception e) {
                emitters.remove(emitter);
                log.debug("Bo client SSE da ngat: {}", e.getMessage());
            }
        }
    }

    public int clientCount() {
        return emitters.size();
    }

    @Scheduled(fixedRate = 20_000)
    void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }
}
