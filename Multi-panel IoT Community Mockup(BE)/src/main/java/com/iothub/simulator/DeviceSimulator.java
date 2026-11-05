package com.iothub.simulator;

import com.iothub.config.AppProperties;
import com.iothub.device.DeviceResponseService;
import com.iothub.mqtt.DeviceControlMessage;
import com.iothub.mqtt.DeviceResponseMessage;
import com.iothub.mqtt.SensorDataMessage;
import com.iothub.sensor.SensorIngestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gia lap NodeMCU khi chua co phan cung / broker (app.simulator.enabled = true):
 * - moi 5 giay sinh du lieu TEMP-01 / HUM-01 / LIGHT-01 nhu firmware;
 * - nhan lenh device_control, kiem tra giong firmware va tra device_response sau ~300ms.
 */
@Component
public class DeviceSimulator {

    private static final Logger log = LoggerFactory.getLogger(DeviceSimulator.class);
    private static final List<String> LED_CODES = List.of("LED-01", "LED-02", "LED-03");

    private final AppProperties props;
    private final SensorIngestService sensorIngest;
    private final DeviceResponseService deviceResponse;
    private final TaskScheduler scheduler;
    private final Random random = new Random();
    private final Map<String, Integer> ledBrightness = new ConcurrentHashMap<>();

    private double temperature = 28.5;
    private double humidity = 65;
    private double light = 600;
    private long tick;

    public DeviceSimulator(AppProperties props, @Lazy SensorIngestService sensorIngest,
                           @Lazy DeviceResponseService deviceResponse, TaskScheduler scheduler) {
        this.props = props;
        this.sensorIngest = sensorIngest;
        this.deviceResponse = deviceResponse;
        this.scheduler = scheduler;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!props.simulator().enabled()) return;
        log.warn("[SIMULATOR] Che do gia lap dang BAT: du lieu cam bien va phan hoi LED la du lieu gia");
        scheduler.scheduleAtFixedRate(this::publishSensorData, Duration.ofMillis(props.simulator().intervalMs()));
    }

    private void publishSensorData() {
        try {
            tick++;
            temperature = clamp(temperature + (random.nextDouble() - 0.5) * 0.4, 22, 36);
            humidity = clamp(humidity + (random.nextDouble() - 0.5) * 1.2, 40, 85);
            light = clamp(light + (random.nextDouble() - 0.5) * 40, 50, 1000);
            // Thinh thoang DHT11 doc loi -> firmware chi gui LIGHT-01
            boolean dhtError = tick % 40 == 0;
            List<SensorDataMessage.Reading> readings = dhtError
                    ? List.of(reading("LIGHT-01", Math.round(light), 0, "ADC"))
                    : List.of(reading("TEMP-01", temperature, 1, null),
                              reading("HUM-01", humidity, 1, null),
                              reading("LIGHT-01", Math.round(light), 0, "ADC"));
            sensorIngest.ingest(new SensorDataMessage("SI:MU:LA:TO:R0:01", readings,
                    Instant.now().truncatedTo(ChronoUnit.SECONDS).toString()));
        } catch (Exception e) {
            log.error("[SIMULATOR] Loi sinh du lieu", e);
        }
    }

    /** Mo phong handleCommand() cua firmware. */
    public void handleCommand(DeviceControlMessage cmd) {
        DeviceResponseMessage response = execute(cmd);
        scheduler.schedule(() -> deviceResponse.process(response), Instant.now().plusMillis(300));
    }

    private DeviceResponseMessage execute(DeviceControlMessage cmd) {
        String now = Instant.now().truncatedTo(ChronoUnit.SECONDS).toString();
        String action = cmd.action();
        int b = cmd.brightness();
        if (b < 0 || b > 100) return error(cmd, "brightness phai la so nguyen 0..100", now);
        if ("ALL".equals(cmd.deviceCode())) {
            if (!"ON".equals(action) && !"OFF".equals(action)) return error(cmd, "ALL chi ho tro ON hoac OFF", now);
            int actual = "OFF".equals(action) ? 0 : b;
            LED_CODES.forEach(c -> ledBrightness.put(c, actual));
            return new DeviceResponseMessage(cmd.actionId(), "ALL", "success", actual > 0 ? "ON" : "OFF", actual,
                    "MANUAL", null, null, now);
        }
        if (!LED_CODES.contains(cmd.deviceCode())) return error(cmd, "device_code phai la LED-01, LED-02 hoac LED-03", now);
        boolean blink = "BLINK".equals(action);
        if (!blink && !"ON".equals(action) && !"OFF".equals(action)) return error(cmd, "action phai la ON, OFF hoac BLINK", now);
        Integer interval = null;
        if (blink) {
            if (b == 0) return error(cmd, "BLINK can brightness 1..100", now);
            interval = cmd.intervalMs() == null ? 1000 : cmd.intervalMs();
            if (interval < 100 || interval > 60000) return error(cmd, "interval_ms phai la so nguyen 100..60000", now);
        }
        int actual = "OFF".equals(action) ? 0 : b;
        ledBrightness.put(cmd.deviceCode(), actual);
        return new DeviceResponseMessage(cmd.actionId(), cmd.deviceCode(), "success", actual > 0 ? "ON" : "OFF",
                actual, blink ? "BLINK" : "MANUAL", interval, null, now);
    }

    private static DeviceResponseMessage error(DeviceControlMessage cmd, String message, String now) {
        return new DeviceResponseMessage(cmd.actionId(), cmd.deviceCode(), "error", null, null, null, null, message, now);
    }

    private static SensorDataMessage.Reading reading(String code, double value, int scale, String unit) {
        return new SensorDataMessage.Reading(code, BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP), unit);
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
