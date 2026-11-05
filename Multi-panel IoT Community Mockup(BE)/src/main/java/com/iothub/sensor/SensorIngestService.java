package com.iothub.sensor;

import com.iothub.common.TimeFormat;
import com.iothub.config.AppProperties;
import com.iothub.mqtt.SensorDataMessage;
import com.iothub.realtime.SseHub;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Luong nen thu thap du lieu (SRS B.5.1): nhan message sensor_data -> tra sensor_id theo sensor_code
 * -> so nguong min/max -> ghi sensor_data -> day su kien realtime cho Frontend.
 */
@Service
public class SensorIngestService {

    private static final Logger log = LoggerFactory.getLogger(SensorIngestService.class);
    private static final Duration MAX_CLOCK_SKEW = Duration.ofMinutes(10);
    private static final BigDecimal MAX_ABS_VALUE = new BigDecimal("99999999");

    private final SensorRepository sensors;
    private final JdbcTemplate jdbc;
    private final SseHub hub;
    private final AppProperties props;

    private volatile Instant lastMessageAt;
    private volatile String lastDeviceMac;

    public SensorIngestService(SensorRepository sensors, JdbcTemplate jdbc, SseHub hub, AppProperties props) {
        this.sensors = sensors;
        this.jdbc = jdbc;
        this.hub = hub;
        this.props = props;
    }

    /** @return so ban ghi da luu */
    public int ingest(SensorDataMessage msg) {
        if (msg == null || msg.readings() == null || msg.readings().isEmpty()) {
            log.warn("[sensor_data] Message khong co readings - bo qua");
            return 0;
        }
        Instant recordedAt = resolveTimestamp(msg.timestamp());
        Map<String, Sensor> byCode = sensors.findAll().stream()
                .collect(Collectors.toMap(Sensor::getSensorCode, Function.identity()));

        List<Object[]> rows = new ArrayList<>();
        List<Map<String, Object>> readings = new ArrayList<>();
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("time", TimeFormat.format(recordedAt, TimeFormat.CLOCK, props.zone()));

        for (SensorDataMessage.Reading r : msg.readings()) {
            if (r == null || r.sensorCode() == null || r.value() == null) continue;
            Sensor sensor = byCode.get(r.sensorCode().trim());
            if (sensor == null) {
                log.warn("[sensor_data] sensor_code '{}' chua co trong bang sensors - bo qua", r.sensorCode());
                continue;
            }
            if (!sensor.isActive()) continue;
            if (r.value().abs().compareTo(MAX_ABS_VALUE) > 0) {
                log.warn("[sensor_data] Gia tri {} cua {} ngoai mien DECIMAL(10,2) - bo qua", r.value(), r.sensorCode());
                continue;
            }
            BigDecimal value = r.value().setScale(2, RoundingMode.HALF_UP);
            String status = sensor.evaluate(value);
            rows.add(new Object[]{sensor.getSensorId(), value, status, Timestamp.from(recordedAt)});

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sensor_code", sensor.getSensorCode());
            item.put("sensor_type", sensor.getSensorType().name());
            item.put("value", value.stripTrailingZeros());
            item.put("unit", sensor.getUnit());
            item.put("status", status);
            item.put("recorded_at", recordedAt);
            readings.add(item);
            point.put(sensor.getSensorType().name(), value.stripTrailingZeros());
        }
        if (rows.isEmpty()) return 0;

        jdbc.batchUpdate("INSERT INTO sensor_data (sensor_id, value, status, recorded_at) VALUES (?, ?, ?, ?)", rows);
        lastMessageAt = Instant.now();
        lastDeviceMac = msg.deviceMac();
        log.debug("[sensor_data] Luu {} ban ghi luc {} tu {}", rows.size(), recordedAt, msg.deviceMac());

        Map<String, Object> event = new LinkedHashMap<>();
        event.put("device_mac", msg.deviceMac());
        event.put("recorded_at", recordedAt);
        event.put("readings", readings);
        event.put("point", point);
        hub.broadcast("sensor_data", event);
        return rows.size();
    }

    /**
     * Dung timestamp cua thiet bi (UTC, dong bo NTP). Neu thieu / sai dinh dang / lech qua 10 phut
     * so voi dong ho server thi dung gio server.
     */
    private Instant resolveTimestamp(String ts) {
        Instant now = Instant.now();
        if (ts != null && !ts.isBlank()) {
            try {
                Instant device = Instant.parse(ts.trim());
                if (Duration.between(device, now).abs().compareTo(MAX_CLOCK_SKEW) <= 0) {
                    return device.truncatedTo(ChronoUnit.SECONDS);
                }
                log.warn("[sensor_data] timestamp {} lech qua nhieu so voi server - dung gio server", ts);
            } catch (DateTimeParseException e) {
                log.warn("[sensor_data] timestamp '{}' khong hop le - dung gio server", ts);
            }
        }
        return now.truncatedTo(ChronoUnit.SECONDS);
    }

    public Instant lastMessageAt() {
        return lastMessageAt;
    }

    public String lastDeviceMac() {
        return lastDeviceMac;
    }
}
