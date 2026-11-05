package com.iothub.dashboard;

import com.iothub.common.TimeFormat;
import com.iothub.config.AppProperties;
import com.iothub.mqtt.MqttGateway;
import com.iothub.realtime.SseHub;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * So lieu tong quan cho trang "Thong tin ca nhan" (SRS 4.1.5): so thiet bi ket noi, so ban ghi trong ngay,
 * so canh bao, ti le uptime. Kem /api/health cong khai de kiem tra trang thai backend.
 */
@RestController
public class DashboardController {

    /** Chu ky gui cua firmware (SENSOR_INTERVAL_MS = 5000). */
    private static final long SENSOR_INTERVAL_SECONDS = 5;

    private final JdbcTemplate jdbc;
    private final MqttGateway mqtt;
    private final SseHub hub;
    private final AppProperties props;

    public DashboardController(JdbcTemplate jdbc, MqttGateway mqtt, SseHub hub, AppProperties props) {
        this.jdbc = jdbc;
        this.mqtt = mqtt;
        this.hub = hub;
        this.props = props;
    }

    @GetMapping("/api/dashboard/stats")
    public Map<String, Object> stats() {
        Instant now = Instant.now();
        Instant startOfDay = LocalDate.now(props.zone()).atStartOfDay(props.zone()).toInstant();
        Timestamp since = Timestamp.from(startOfDay);

        Map<String, Object> devices = jdbc.queryForMap("""
                SELECT COUNT(*) AS total,
                       COALESCE(SUM(status = 'active'), 0) AS active,
                       COALESCE(SUM(status = 'active' AND current_state = 'ON'), 0) AS turned_on
                FROM devices
                """);
        Map<String, Object> today = jdbc.queryForMap("""
                SELECT COUNT(*) AS records,
                       COALESCE(SUM(status = 'warning'), 0) AS warnings,
                       COUNT(DISTINCT recorded_at) AS samples
                FROM sensor_data WHERE recorded_at >= ?
                """, since);
        Long actionsToday = jdbc.queryForObject("SELECT COUNT(*) FROM device_actions WHERE performed_at >= ?", Long.class, since);
        Long totalRecords = jdbc.queryForObject("SELECT COUNT(*) FROM sensor_data", Long.class);
        Timestamp last = jdbc.queryForObject("SELECT MAX(recorded_at) FROM sensor_data", Timestamp.class);
        Instant lastDataAt = TimeFormat.toInstant(last);
        boolean deviceOnline = lastDataAt != null && lastDataAt.isAfter(now.minus(props.sensor().offlineAfter()));

        // Uptime hom nay = so lan nhan du lieu / so lan ky vong (moi 5 giay) ke tu 00:00
        long elapsed = Math.max(1, Duration.between(startOfDay, now).toSeconds());
        long expected = Math.max(1, elapsed / SENSOR_INTERVAL_SECONDS);
        long samples = ((Number) today.get("samples")).longValue();
        double uptime = Math.min(100.0, Math.round(samples * 1000.0 / expected) / 10.0);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("devices_total", ((Number) devices.get("total")).longValue());
        data.put("devices_active", ((Number) devices.get("active")).longValue());
        data.put("devices_on", ((Number) devices.get("turned_on")).longValue());
        data.put("device_online", deviceOnline);
        data.put("records_today", ((Number) today.get("records")).longValue());
        data.put("warnings_today", ((Number) today.get("warnings")).longValue());
        data.put("actions_today", actionsToday);
        data.put("records_total", totalRecords);
        data.put("uptime_percent", uptime);
        data.put("last_data_at", lastDataAt);
        data.put("mqtt_connected", mqtt.isConnected());
        data.put("simulator", props.simulator().enabled());
        return Map.of("success", true, "data", data);
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("status", "UP");
        m.put("time", Instant.now());
        boolean db;
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            db = true;
        } catch (Exception e) {
            db = false;
        }
        m.put("database", db ? "UP" : "DOWN");
        m.put("mqtt", mqtt.status());
        m.put("simulator", props.simulator().enabled());
        m.put("sse_clients", hub.clientCount());
        return m;
    }
}
