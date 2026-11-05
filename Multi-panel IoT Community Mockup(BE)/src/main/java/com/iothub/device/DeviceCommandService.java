package com.iothub.device;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iothub.common.ActiveStatus;
import com.iothub.common.ApiException;
import com.iothub.config.AppProperties;
import com.iothub.config.MqttProperties;
import com.iothub.device.DeviceEnums.ActionSource;
import com.iothub.device.DeviceEnums.Command;
import com.iothub.device.DeviceEnums.ResultStatus;
import com.iothub.mqtt.DeviceControlMessage;
import com.iothub.mqtt.DeviceResponseMessage;
import com.iothub.mqtt.MqttGateway;
import com.iothub.realtime.SseHub;
import com.iothub.simulator.DeviceSimulator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Luong dieu khien LED (SRS UC3 / B.4.2 / B.5.2):
 * ghi device_actions (is_confirmed = false) -> publish device_control -> cho device_response (timeout 5s).
 * Dung chung cho dieu khien thu cong (REST) va Bo lap lich.
 */
@Service
public class DeviceCommandService {

    private static final Logger log = LoggerFactory.getLogger(DeviceCommandService.class);
    private static final Duration TIMEOUT_GRACE = Duration.ofMillis(500);

    /** Lenh da chuan hoa, san sang gui xuong firmware. */
    public record CommandSpec(Command action, int brightness, Integer intervalMs) {}

    public record Dispatch(DeviceAction action, Device device, CompletableFuture<DeviceResponseMessage> response,
                           boolean sent, String error) {}

    private final DeviceRepository devices;
    private final DeviceActionRepository actions;
    private final DeviceActionQueryService actionQuery;
    private final PendingResponses pending;
    private final MqttGateway mqtt;
    private final DeviceSimulator simulator;
    private final ObjectMapper mapper;
    private final SseHub hub;
    private final TaskScheduler scheduler;
    private final TransactionTemplate tx;
    private final AppProperties props;
    private final MqttProperties mqttProps;

    public DeviceCommandService(DeviceRepository devices, DeviceActionRepository actions,
                                DeviceActionQueryService actionQuery, PendingResponses pending, MqttGateway mqtt,
                                DeviceSimulator simulator, ObjectMapper mapper, SseHub hub, TaskScheduler scheduler,
                                TransactionTemplate tx, AppProperties props, MqttProperties mqttProps) {
        this.devices = devices;
        this.actions = actions;
        this.actionQuery = actionQuery;
        this.pending = pending;
        this.mqtt = mqtt;
        this.simulator = simulator;
        this.mapper = mapper;
        this.hub = hub;
        this.scheduler = scheduler;
        this.tx = tx;
        this.props = props;
        this.mqttProps = mqttProps;
    }

    // ------------------------------------------------------------------ chuan hoa lenh

    /** Kiem tra va chuan hoa giong rang buoc cua firmware de lenh khong bi thiet bi tu choi. */
    public CommandSpec normalize(Device device, String action, Integer brightness, Integer intervalMs) {
        if (action == null || action.isBlank()) throw ApiException.badRequest("Thiếu action (ON | OFF | BLINK)");
        Command cmd;
        try {
            cmd = Command.valueOf(action.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("action phải là ON, OFF hoặc BLINK");
        }
        if (brightness != null && (brightness < 0 || brightness > 100)) {
            throw ApiException.badRequest("brightness phải là số nguyên 0..100");
        }
        return switch (cmd) {
            case OFF -> new CommandSpec(Command.OFF, 0, null);
            case ON -> {
                int b = brightness != null ? brightness
                        : device != null && device.getBrightness() != null && device.getBrightness() > 0 ? device.getBrightness() : 100;
                // ON voi do sang 0 thuc chat la tat den
                yield b == 0 ? new CommandSpec(Command.OFF, 0, null) : new CommandSpec(Command.ON, b, null);
            }
            case BLINK -> {
                int b = brightness != null ? brightness : 100;
                if (b < 1) throw ApiException.badRequest("BLINK cần brightness 1..100");
                int interval = intervalMs != null ? intervalMs : 1000;
                if (interval < 100 || interval > 60000) throw ApiException.badRequest("interval_ms phải là số nguyên 100..60000");
                yield new CommandSpec(Command.BLINK, b, interval);
            }
        };
    }

    // ------------------------------------------------------------------ gui lenh

    public Dispatch dispatch(Device device, CommandSpec spec, Integer userId, ActionSource source) {
        DeviceAction action = actions.save(new DeviceAction(device.getDeviceId(), userId, spec.action(),
                spec.brightness(), spec.intervalMs(), source));
        long id = action.getActionId();
        CompletableFuture<DeviceResponseMessage> response = pending.register(id);
        hub.broadcast("device_action", actionQuery.find(id));

        DeviceControlMessage msg = new DeviceControlMessage(id, device.getDeviceCode(), spec.action().name(),
                spec.brightness(), spec.action() == Command.BLINK ? spec.intervalMs() : null);
        String error = send(msg);
        if (error != null) {
            log.warn("[device_control] Khong gui duoc action_id={}: {}", id, error);
            pending.forget(id);
            markFailed(id, error);
            return new Dispatch(action, device, response, false, error);
        }
        log.info("[device_control] action_id={} {} {} {}% ({})", id, device.getDeviceCode(), spec.action(),
                spec.brightness(), source);
        // Het timeout ma chua co phan hoi -> 'unconfirmed' (cho phep nguoi dung gui lai)
        scheduler.schedule(() -> markUnconfirmed(id),
                Instant.now().plus(props.device().responseTimeout()).plus(TIMEOUT_GRACE));
        return new Dispatch(action, device, response, true, null);
    }

    /** @return null neu gui thanh cong, nguoc lai la mo ta loi. */
    private String send(DeviceControlMessage msg) {
        if (props.simulator().enabled()) {
            simulator.handleCommand(msg);
            return null;
        }
        if (!mqtt.isConnected()) {
            return "Chưa kết nối MQTT broker (" + mqttProps.brokerUrl() + ")";
        }
        try {
            mqtt.publish(mqttProps.topics().deviceControl(), mapper.writeValueAsString(msg));
            return null;
        } catch (JsonProcessingException e) {
            return "Không tạo được payload JSON";
        } catch (Exception e) {
            return "Gửi MQTT thất bại: " + e.getMessage();
        }
    }

    private void markFailed(long id, String message) {
        tx.executeWithoutResult(s -> actions.findById(id).ifPresent(a -> a.markFailed(message)));
        hub.broadcast("device_action", actionQuery.find(id));
    }

    private void markUnconfirmed(long id) {
        pending.forget(id);
        if (actions.transition(id, ResultStatus.pending, ResultStatus.unconfirmed) > 0) {
            log.warn("[device_control] action_id={} khong nhan duoc device_response trong {}", id,
                    props.device().responseTimeout());
            hub.broadcast("device_action", actionQuery.find(id));
        }
    }

    // ------------------------------------------------------------------ API dieu khien

    /** B.4.2 - dieu khien 1 LED. wait = false: tra ngay is_confirmed = false (khong cho phan hoi). */
    public Map<String, Object> control(int deviceId, String action, Integer brightness, Integer intervalMs,
                                       Integer userId, Boolean waitOverride) {
        Device device = devices.findById(deviceId).orElseThrow(() -> ApiException.notFound("Không tìm thấy thiết bị"));
        if (device.getStatus() != ActiveStatus.active) throw ApiException.badRequest("Thiết bị đang ngừng hoạt động");
        CommandSpec spec = normalize(device, action, brightness, intervalMs);
        Dispatch d = dispatch(device, spec, userId, ActionSource.manual);
        if (!d.sent()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được lệnh tới thiết bị: " + d.error());
        }
        boolean wait = waitOverride != null ? waitOverride : props.device().waitForResponse();
        if (!wait) return result(d, null);

        DeviceResponseMessage resp = await(d, props.device().responseTimeout());
        if (resp == null) {
            markUnconfirmed(d.action().getActionId());
            throw new ApiException(HttpStatus.REQUEST_TIMEOUT, "Không nhận được phản hồi từ thiết bị. Vui lòng thử lại.");
        }
        if (!resp.isSuccess()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "Thiết bị báo lỗi: " + (resp.message() != null ? resp.message() : "không thực thi được lệnh"));
        }
        return result(d, resp);
    }

    /** Mo rong: bat/tat ca 3 LED. Gui tung lenh rieng (moi LED mot action_id) de luu lich su day du. */
    public Map<String, Object> controlAll(String action, Integer brightness, Integer userId, Boolean waitOverride) {
        List<Device> targets = devices.findByStatusOrderByDeviceId(ActiveStatus.active);
        if (targets.isEmpty()) throw ApiException.badRequest("Không có thiết bị nào đang hoạt động");
        CommandSpec first = normalize(null, action, brightness, null);
        if (first.action() == Command.BLINK) throw ApiException.badRequest("Điều khiển tất cả chỉ hỗ trợ ON hoặc OFF");

        List<Dispatch> sent = new ArrayList<>();
        List<Map<String, Object>> results = new ArrayList<>();
        for (Device device : targets) {
            Dispatch d = dispatch(device, normalize(device, action, brightness, null), userId, ActionSource.manual);
            if (d.sent()) sent.add(d);
            else results.add(result(d, null));
        }
        if (sent.isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Không gửi được lệnh tới thiết bị: " + results.get(0).get("message"));
        }
        boolean wait = waitOverride != null ? waitOverride : props.device().waitForResponse();
        Instant deadline = Instant.now().plus(props.device().responseTimeout());
        int confirmed = 0;
        for (Dispatch d : sent) {
            DeviceResponseMessage resp = null;
            if (wait) {
                Duration left = Duration.between(Instant.now(), deadline);
                resp = await(d, left.isNegative() ? Duration.ZERO : left);
                if (resp == null) markUnconfirmed(d.action().getActionId());
            }
            if (resp != null && resp.isSuccess()) confirmed++;
            results.add(result(d, resp));
        }
        if (wait && confirmed == 0) {
            throw new ApiException(HttpStatus.REQUEST_TIMEOUT, "Không nhận được phản hồi từ thiết bị. Vui lòng thử lại.");
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("requested_state", first.action().name());
        res.put("all_confirmed", wait && confirmed == targets.size());
        res.put("data", results);
        return res;
    }

    private DeviceResponseMessage await(Dispatch d, Duration timeout) {
        try {
            return d.response().get(Math.max(1, timeout.toMillis()), TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (ExecutionException e) {
            return null;
        }
    }

    private Map<String, Object> result(Dispatch d, DeviceResponseMessage resp) {
        DeviceAction a = d.action();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", d.sent() && (resp == null || resp.isSuccess()));
        m.put("action_id", a.getActionId());
        m.put("device_id", d.device().getDeviceId());
        m.put("device_code", d.device().getDeviceCode());
        m.put("requested_state", a.getAction().name());
        m.put("brightness", a.getBrightness());
        if (a.getIntervalMs() != null) m.put("interval_ms", a.getIntervalMs());
        m.put("is_confirmed", resp != null && resp.isSuccess());
        m.put("status", !d.sent() ? "failed" : resp == null ? "pending" : resp.isSuccess() ? "success" : "failed");
        if (resp != null) {
            m.put("current_state", resp.currentState());
            m.put("current_brightness", resp.brightness());
            m.put("mode", resp.mode());
        }
        if (!d.sent()) m.put("message", d.error());
        else if (resp != null && !resp.isSuccess()) m.put("message", resp.message());
        return m;
    }
}
