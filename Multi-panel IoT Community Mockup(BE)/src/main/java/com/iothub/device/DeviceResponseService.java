package com.iothub.device;

import com.iothub.common.ActiveStatus;
import com.iothub.device.DeviceEnums.Mode;
import com.iothub.device.DeviceEnums.PowerState;
import com.iothub.mqtt.DeviceResponseMessage;
import com.iothub.realtime.SseHub;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;

/**
 * Xu ly topic device_response (SRS B.5.3 / UC3 buoc 7): doi chieu action_id -> is_confirmed = true,
 * dong bo current_state + brightness vao bang devices, roi bao cho request dang cho va kenh realtime.
 */
@Service
public class DeviceResponseService {

    private static final Logger log = LoggerFactory.getLogger(DeviceResponseService.class);

    private final DeviceActionRepository actions;
    private final DeviceRepository devices;
    private final PendingResponses pending;
    private final DeviceActionQueryService actionQuery;
    private final SseHub hub;
    private final TransactionTemplate tx;

    public DeviceResponseService(DeviceActionRepository actions, DeviceRepository devices, PendingResponses pending,
                                 DeviceActionQueryService actionQuery, SseHub hub, TransactionTemplate tx) {
        this.actions = actions;
        this.devices = devices;
        this.pending = pending;
        this.actionQuery = actionQuery;
        this.hub = hub;
        this.tx = tx;
    }

    public void process(DeviceResponseMessage msg) {
        if (msg == null || msg.actionId() == null || msg.actionId() <= 0) {
            log.warn("[device_response] Thieu action_id hop le - bo qua: {}", msg);
            return;
        }
        long id = msg.actionId();
        List<Device> changed = tx.execute(status -> apply(msg));
        if (changed == null) return;
        log.info("[device_response] action_id={} {} {} -> {} {}%", id, msg.deviceCode(), msg.status(),
                msg.currentState(), msg.brightness());
        // Commit xong moi bao cho request dang cho, dam bao doc lai DB thay trang thai moi
        pending.complete(id, msg);
        changed.forEach(d -> hub.broadcast("device_state", d.toView()));
        hub.broadcast("device_action", actionQuery.find(id));
    }

    /** @return cac thiet bi da cap nhat trang thai; null neu khong tim thay action_id. */
    private List<Device> apply(DeviceResponseMessage msg) {
        Optional<DeviceAction> found = actions.findById(msg.actionId());
        if (found.isEmpty()) {
            log.warn("[device_response] action_id={} khong ton tai trong device_actions - bo qua", msg.actionId());
            return null;
        }
        DeviceAction action = found.get();
        if (!msg.isSuccess()) {
            action.markFailed(msg.message() != null ? msg.message() : "Thiết bị báo lỗi khi thực thi lệnh");
            return List.of();
        }
        action.markSuccess();

        List<Device> targets = "ALL".equalsIgnoreCase(msg.deviceCode())
                ? devices.findByStatusOrderByDeviceId(ActiveStatus.active)
                : devices.findById(action.getDeviceId()).map(List::of).orElse(List.of());
        for (Device d : targets) {
            int brightness = clamp(msg.brightness() != null ? msg.brightness()
                    : action.getBrightness() != null ? action.getBrightness() : d.getBrightness());
            d.setBrightness(brightness);
            d.setCurrentState(parseState(msg.currentState(), brightness));
            boolean blink = "BLINK".equalsIgnoreCase(msg.mode());
            d.setMode(blink ? Mode.BLINK : Mode.MANUAL);
            d.setBlinkIntervalMs(blink ? (msg.intervalMs() != null ? msg.intervalMs() : action.getIntervalMs()) : null);
        }
        return targets;
    }

    private static PowerState parseState(String state, int brightness) {
        if ("ON".equalsIgnoreCase(state)) return PowerState.ON;
        if ("OFF".equalsIgnoreCase(state)) return PowerState.OFF;
        return brightness > 0 ? PowerState.ON : PowerState.OFF;
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(100, v));
    }
}
