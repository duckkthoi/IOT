package com.iothub.sensor;

import com.iothub.common.ApiException;
import com.iothub.common.CsvWriter;
import com.iothub.common.PageRequest;
import com.iothub.common.PageResponse;
import com.iothub.common.SqlWhere;
import com.iothub.common.TimeFormat;
import com.iothub.common.TimeRange;
import com.iothub.config.AppProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Truy van du lieu cam bien cho UC1 (realtime), UC2 (bieu do) va UC4 (bang lich su + CSV).
 * Dung JDBC thuan vi can gom nhom / xoay cot (pivot) theo thoi diem ghi nhan.
 */
@Service
public class SensorQueryService {

    /** Filter dung chung cho bang du lieu (UC4) va bang tung lan do. */
    public record DataFilter(TimeRange range, String status, String search, String searchBy, SensorType type, String sort) {}

    private static final String TIME_FMT = "'%Y-%m-%d %H:%i:%s'";

    private final NamedParameterJdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate exportJdbc;
    private final AppProperties props;

    public SensorQueryService(NamedParameterJdbcTemplate jdbc, DataSource dataSource, AppProperties props) {
        this.jdbc = jdbc;
        // MySQL Connector/J: fetchSize = Integer.MIN_VALUE -> stream tung dong khi xuat CSV lon
        JdbcTemplate streaming = new JdbcTemplate(dataSource);
        streaming.setFetchSize(Integer.MIN_VALUE);
        this.exportJdbc = new NamedParameterJdbcTemplate(streaming);
        this.props = props;
    }

    private ZoneId zone() {
        return props.zone();
    }

    /** Bieu thuc SQL cho thoi gian dia phuong dang chuoi "yyyy-MM-dd HH:mm:ss" (session JDBC la UTC). */
    private String localTimeSql(String column) {
        return "DATE_FORMAT(DATE_ADD(" + column + ", INTERVAL :tz_offset SECOND), " + TIME_FMT + ")";
    }

    private int zoneOffsetSeconds() {
        return zone().getRules().getOffset(Instant.now()).getTotalSeconds();
    }

    // ------------------------------------------------------------------ UC1

    /** B.3.1 - gia tri moi nhat cua tung cam bien; trendPoints &gt; 0 thi kem chuoi xu huong ngan han. */
    public List<Map<String, Object>> realtime(int trendPoints) {
        String sql = """
                SELECT s.sensor_id, s.sensor_code, s.sensor_name, s.sensor_type, s.unit, s.location,
                       s.min_threshold, s.max_threshold, d.value, d.status, d.recorded_at
                FROM sensors s
                LEFT JOIN sensor_data d ON d.data_id = (
                    SELECT d2.data_id FROM sensor_data d2
                    WHERE d2.sensor_id = s.sensor_id
                    ORDER BY d2.recorded_at DESC, d2.data_id DESC LIMIT 1)
                WHERE s.status = 'active'
                ORDER BY s.sensor_id
                """;
        Instant onlineSince = Instant.now().minus(props.sensor().offlineAfter());
        List<Map<String, Object>> list = jdbc.query(sql, (rs, i) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            Instant recordedAt = TimeFormat.toInstant(rs.getTimestamp("recorded_at"));
            boolean online = recordedAt != null && recordedAt.isAfter(onlineSince);
            m.put("sensor_id", rs.getInt("sensor_id"));
            m.put("sensor_code", rs.getString("sensor_code"));
            m.put("sensor_name", rs.getString("sensor_name"));
            m.put("sensor_type", rs.getString("sensor_type"));
            m.put("value", num(rs.getBigDecimal("value")));
            m.put("unit", rs.getString("unit"));
            m.put("status", rs.getString("status"));
            m.put("recorded_at", recordedAt);
            // Luong thay the UC1: qua thoi gian quy dinh khong co du lieu -> mat tin hieu
            m.put("online", online);
            m.put("signal", recordedAt == null ? "no_data" : online ? "ok" : "lost");
            m.put("min_threshold", num(rs.getBigDecimal("min_threshold")));
            m.put("max_threshold", num(rs.getBigDecimal("max_threshold")));
            return m;
        });
        if (trendPoints > 0) {
            int n = Math.min(trendPoints, 200);
            for (Map<String, Object> m : list) {
                List<Map<String, Object>> trend = jdbc.query("""
                                SELECT value, recorded_at FROM sensor_data
                                WHERE sensor_id = :id ORDER BY recorded_at DESC, data_id DESC LIMIT :n
                                """,
                        new MapSqlParameterSource("id", m.get("sensor_id")).addValue("n", n),
                        (rs, i) -> {
                            Map<String, Object> p = new LinkedHashMap<>();
                            Instant at = TimeFormat.toInstant(rs.getTimestamp("recorded_at"));
                            p.put("time", TimeFormat.format(at, TimeFormat.CLOCK, zone()));
                            p.put("value", num(rs.getBigDecimal("value")));
                            p.put("recorded_at", at);
                            return p;
                        });
                Collections.reverse(trend);
                m.put("trend", trend);
            }
        }
        return list;
    }

    /**
     * Mo rong cho bieu do LIVE tren Trang chu: N thoi diem gan nhat, moi diem gom ca 3 cam bien
     * (cung cau truc {time, temperature, light, humidity} voi /api/sensors/history).
     */
    public List<Map<String, Object>> live(int points) {
        int n = Math.max(1, Math.min(points, 500));
        String sql = """
                SELECT d.recorded_at, s.sensor_type, d.value
                FROM sensor_data d
                JOIN sensors s ON s.sensor_id = d.sensor_id
                JOIN (SELECT DISTINCT recorded_at FROM sensor_data ORDER BY recorded_at DESC LIMIT :n) t
                  ON t.recorded_at = d.recorded_at
                ORDER BY d.recorded_at, s.sensor_id
                """;
        Map<Instant, Map<String, Object>> byTime = new LinkedHashMap<>();
        jdbc.query(sql, new MapSqlParameterSource("n", n), rs -> {
            Instant at = TimeFormat.toInstant(rs.getTimestamp("recorded_at"));
            Map<String, Object> p = byTime.computeIfAbsent(at, k -> newPoint(TimeFormat.format(k, TimeFormat.CLOCK, zone()), k));
            p.put(rs.getString("sensor_type"), num(rs.getBigDecimal("value")));
        });
        return new ArrayList<>(byTime.values());
    }

    // ------------------------------------------------------------------ UC2

    /** B.3.2 - tong hop (trung binh) theo moc: today = tung gio, week = 7 ngay, month = 30 ngay. */
    public Map<String, Object> history(String range, String type) {
        String r = range == null || range.isBlank() ? "today" : range.trim().toLowerCase(Locale.ROOT);
        String t = type == null || type.isBlank() ? "all" : type.trim().toLowerCase(Locale.ROOT);
        SensorType sensorType = null;
        if (!"all".equals(t)) {
            sensorType = SensorType.parse(t);
            if (sensorType == null) throw ApiException.badRequest("type phải là all | temperature | humidity | light");
        }
        ZoneId zone = zone();
        LocalDate today = LocalDate.now(zone);
        Instant now = Instant.now();
        Instant from;
        long bucket;
        DateTimeFormatter labelFmt = null;
        switch (r) {
            case "today" -> {
                from = today.atStartOfDay(zone).toInstant();
                bucket = 3600;
                labelFmt = DateTimeFormatter.ofPattern("HH:00");
            }
            case "week" -> {
                from = today.minusDays(6).atStartOfDay(zone).toInstant();
                bucket = 86400;
            }
            case "month" -> {
                from = today.minusDays(29).atStartOfDay(zone).toInstant();
                bucket = 86400;
                labelFmt = DateTimeFormatter.ofPattern("dd/MM");
            }
            default -> throw ApiException.badRequest("range phải là today | week | month");
        }
        int offset = zoneOffsetSeconds();
        SqlWhere w = new SqlWhere()
                .where("d.recorded_at >= :from").param("from", TimeFormat.toTimestamp(from))
                .where("d.recorded_at <= :to").param("to", TimeFormat.toTimestamp(now))
                .param("offset", offset).param("bucket", bucket);
        if (sensorType != null) w.where("s.sensor_type = :type").param("type", sensorType.name());
        String sql = "SELECT FLOOR((UNIX_TIMESTAMP(d.recorded_at) + :offset) / :bucket) AS b, s.sensor_type AS t, AVG(d.value) AS v "
                + "FROM sensor_data d JOIN sensors s ON s.sensor_id = d.sensor_id"
                + w.whereSql() + " GROUP BY b, t";
        Map<Long, Map<String, BigDecimal>> agg = new HashMap<>();
        jdbc.query(sql, w.params(), rs -> {
            agg.computeIfAbsent(rs.getLong("b"), k -> new HashMap<>()).put(rs.getString("t"), rs.getBigDecimal("v"));
        });

        List<String> types = sensorType == null ? List.of("temperature", "light", "humidity") : List.of(sensorType.name());
        long firstBucket = Math.floorDiv(from.getEpochSecond() + offset, bucket);
        long lastBucket = Math.floorDiv(now.getEpochSecond() + offset, bucket);
        List<Map<String, Object>> series = new ArrayList<>();
        for (long b = firstBucket; b <= lastBucket; b++) {
            Instant start = Instant.ofEpochSecond(b * bucket - offset);
            ZonedDateTime local = start.atZone(zone);
            String label = labelFmt != null ? labelFmt.format(local) : weekdayLabel(local.getDayOfWeek());
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("time", label);
            Map<String, BigDecimal> values = agg.getOrDefault(b, Map.of());
            for (String ty : types) {
                p.put(ty, round(values.get(ty), "light".equals(ty) ? 0 : 1));
            }
            p.put("start", start);
            series.add(p);
        }
        boolean hasData = !agg.isEmpty();
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("range", r);
        res.put("type", t);
        res.put("has_data", hasData);
        if (!hasData) res.put("message", "Không có dữ liệu trong khoảng thời gian đã chọn");
        res.put("series", series);
        return res;
    }

    private static String weekdayLabel(DayOfWeek d) {
        return d == DayOfWeek.SUNDAY ? "Chủ nhật" : "Thứ " + (d.getValue() + 1);
    }

    // ------------------------------------------------------------------ UC4 - bang gom theo thoi diem

    private SqlWhere groupedWhere(DataFilter f) {
        SqlWhere w = new SqlWhere().param("tz_offset", zoneOffsetSeconds());
        w.timeRange("d.recorded_at", f.range());
        if ("normal".equals(f.status())) w.having("has_warning = 0");
        else if ("warning".equals(f.status())) w.having("has_warning = 1");
        String q = f.search() == null ? "" : f.search().trim();
        if (!q.isEmpty()) {
            String digits = q.startsWith("#") ? q.substring(1) : q;
            String timeCond = localTimeSql("d.recorded_at") + " LIKE :q_time";
            w.param("q_time", "%" + q + "%");
            if (digits.matches("\\d{1,18}")) {
                w.having("(id = :q_id OR " + timeCond + ")").param("q_id", Long.parseLong(digits));
            } else {
                w.having(timeCond);
            }
        }
        return w;
    }

    private static final String GROUPED_SELECT = """
            SELECT MIN(d.data_id) AS id, d.recorded_at,
                   MAX(CASE WHEN s.sensor_type = 'temperature' THEN d.value END) AS temperature,
                   MAX(CASE WHEN s.sensor_type = 'light' THEN d.value END) AS light,
                   MAX(CASE WHEN s.sensor_type = 'humidity' THEN d.value END) AS humidity,
                   MAX(CASE WHEN d.status = 'warning' THEN 1 ELSE 0 END) AS has_warning
            FROM sensor_data d JOIN sensors s ON s.sensor_id = d.sensor_id
            """;

    /** B.3.3 - moi dong la mot lan gui cua thiet bi (cung recorded_at) gom nhiet do / anh sang / do am. */
    public PageResponse<Map<String, Object>> groupedData(DataFilter f, PageRequest page) {
        SqlWhere w = groupedWhere(f);
        String base = GROUPED_SELECT + w.whereSql() + " GROUP BY d.recorded_at" + w.havingSql();
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM (" + base + ") t", w.params(), Long.class);
        String order = "oldest".equals(f.sort()) ? " ORDER BY d.recorded_at ASC" : " ORDER BY d.recorded_at DESC";
        w.param("limit", page.limit()).param("offset", page.offset());
        List<Map<String, Object>> data = jdbc.query(base + order + " LIMIT :limit OFFSET :offset", w.params(),
                (rs, i) -> groupedRow(rs));
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("time_range", f.range().key());
        filters.put("status", f.status());
        filters.put("from", f.range().fromIso());
        filters.put("to", f.range().toIso());
        filters.put("search", f.search());
        return PageResponse.of(data, total == null ? 0 : total, page, filters);
    }

    private Map<String, Object> groupedRow(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        long id = rs.getLong("id");
        Instant at = TimeFormat.toInstant(rs.getTimestamp("recorded_at"));
        m.put("id", formatId(id));
        m.put("data_id", id);
        m.put("recorded_at", at);
        m.put("display_time", TimeFormat.format(at, TimeFormat.DATE_TIME, zone()));
        m.put("temperature", num(rs.getBigDecimal("temperature")));
        m.put("light", num(rs.getBigDecimal("light")));
        m.put("humidity", num(rs.getBigDecimal("humidity")));
        m.put("status", rs.getInt("has_warning") == 1 ? "warning" : "normal");
        return m;
    }

    /** B.3.4 - xuat CSV toan bo du lieu da loc (khong phan trang). */
    public void exportGrouped(DataFilter f, CsvWriter csv) {
        Map<String, String> units = unitsByType();
        csv.row("ID", "Thời gian", "Nhiệt độ (" + units.get("temperature") + ")", "Ánh sáng (" + units.get("light") + ")",
                "Độ ẩm (" + units.get("humidity") + ")", "Trạng thái");
        SqlWhere w = groupedWhere(f);
        String order = "oldest".equals(f.sort()) ? " ORDER BY d.recorded_at ASC" : " ORDER BY d.recorded_at DESC";
        String sql = GROUPED_SELECT + w.whereSql() + " GROUP BY d.recorded_at" + w.havingSql() + order;
        exportJdbc.query(sql, w.params(), rs -> {
            Map<String, Object> r = groupedRow(rs);
            csv.row(r.get("id"), r.get("display_time"), plain(r.get("temperature")), plain(r.get("light")),
                    plain(r.get("humidity")), "warning".equals(r.get("status")) ? "Cảnh báo" : "Bình thường");
        });
    }

    // ------------------------------------------------------------------ Bang tung lan do (trang "Du lieu cam bien" cua FE)

    private SqlWhere readingsWhere(DataFilter f) {
        SqlWhere w = new SqlWhere().param("tz_offset", zoneOffsetSeconds());
        w.timeRange("d.recorded_at", f.range());
        if (f.type() != null) w.where("s.sensor_type = :type").param("type", f.type().name());
        if ("normal".equals(f.status()) || "warning".equals(f.status())) {
            w.where("d.status = :status").param("status", f.status());
        }
        String q = f.search() == null ? "" : f.search().trim();
        if (!q.isEmpty()) {
            String by = f.searchBy() == null ? "auto" : f.searchBy();
            if ("auto".equals(by)) {
                by = q.startsWith("#") ? "id" : q.matches("-?\\d+([.,]\\d+)?") ? "value" : "time";
            }
            switch (by) {
                case "id" -> {
                    String digits = q.startsWith("#") ? q.substring(1) : q;
                    if (!digits.matches("\\d{1,18}")) throw ApiException.badRequest("Mã bản ghi không hợp lệ");
                    w.where("d.data_id = :q_id").param("q_id", Long.parseLong(digits));
                }
                case "value" -> {
                    String v = q.replace(',', '.');
                    if (!v.matches("-?\\d+(\\.\\d+)?")) throw ApiException.badRequest("Giá trị tìm kiếm phải là số");
                    if (v.contains(".")) {
                        // so thap phan -> khop chinh xac (28.4 -> 28.40)
                        w.where("d.value = :q_val").param("q_val", new BigDecimal(v));
                    } else {
                        // so nguyen -> khop ca phan thap phan (28 -> 28.x)
                        w.where("TRUNCATE(d.value, 0) = :q_val").param("q_val", Long.parseLong(v));
                    }
                }
                case "time" -> w.where(localTimeSql("d.recorded_at") + " LIKE :q_time").param("q_time", "%" + q + "%");
                default -> throw ApiException.badRequest("search_by phải là auto | id | value | time");
            }
        }
        return w;
    }

    private static String readingsOrder(String sort) {
        return switch (sort == null ? "newest" : sort) {
            case "oldest" -> " ORDER BY d.recorded_at ASC, d.data_id ASC";
            case "value_desc" -> " ORDER BY d.value DESC, d.data_id DESC";
            case "value_asc" -> " ORDER BY d.value ASC, d.data_id DESC";
            case "id_asc" -> " ORDER BY d.data_id ASC";
            case "id_desc" -> " ORDER BY d.data_id DESC";
            case "type_asc" -> " ORDER BY s.sensor_type ASC, d.data_id DESC";
            case "type_desc" -> " ORDER BY s.sensor_type DESC, d.data_id DESC";
            case "newest" -> " ORDER BY d.recorded_at DESC, d.data_id DESC";
            default -> throw ApiException.badRequest(
                    "sort phải là newest | oldest | value_desc | value_asc | id_asc | id_desc | type_asc | type_desc");
        };
    }

    private static final String READINGS_SELECT = """
            SELECT d.data_id, d.value, d.status, d.recorded_at, s.sensor_code, s.sensor_name, s.sensor_type, s.unit
            FROM sensor_data d JOIN sensors s ON s.sensor_id = d.sensor_id
            """;

    public PageResponse<Map<String, Object>> readings(DataFilter f, PageRequest page) {
        SqlWhere w = readingsWhere(f);
        String order = readingsOrder(f.sort());
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sensor_data d JOIN sensors s ON s.sensor_id = d.sensor_id" + w.whereSql(),
                w.params(), Long.class);
        w.param("limit", page.limit()).param("offset", page.offset());
        List<Map<String, Object>> data = jdbc.query(READINGS_SELECT + w.whereSql() + order + " LIMIT :limit OFFSET :offset",
                w.params(), (rs, i) -> readingRow(rs));
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("type", f.type() == null ? "all" : f.type().name());
        filters.put("time_range", f.range().key());
        filters.put("status", f.status());
        filters.put("search", f.search());
        filters.put("sort", f.sort());
        return PageResponse.of(data, total == null ? 0 : total, page, filters);
    }

    private Map<String, Object> readingRow(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        long id = rs.getLong("data_id");
        Instant at = TimeFormat.toInstant(rs.getTimestamp("recorded_at"));
        BigDecimal value = num(rs.getBigDecimal("value"));
        String unit = rs.getString("unit");
        m.put("no", id);
        m.put("id", formatId(id));
        m.put("data_id", id);
        m.put("sensor_code", rs.getString("sensor_code"));
        m.put("sensor_name", rs.getString("sensor_name"));
        m.put("sensor_type", rs.getString("sensor_type"));
        m.put("value", value);
        m.put("unit", unit);
        m.put("formatted_value", (value == null ? "" : value.toPlainString()) + " " + unit);
        m.put("status", rs.getString("status"));
        m.put("recorded_at", at);
        m.put("timestamp", TimeFormat.format(at, TimeFormat.DATE_TIME, zone()));
        return m;
    }

    public void exportReadings(DataFilter f, CsvWriter csv) {
        csv.row("Mã bản ghi", "Mã cảm biến", "Loại cảm biến", "Giá trị", "Đơn vị", "Trạng thái", "Thời gian");
        SqlWhere w = readingsWhere(f);
        exportJdbc.query(READINGS_SELECT + w.whereSql() + readingsOrder(f.sort()), w.params(), rs -> {
            Map<String, Object> r = readingRow(rs);
            csv.row(r.get("id"), r.get("sensor_code"), r.get("sensor_type"), plain(r.get("value")), r.get("unit"),
                    "warning".equals(r.get("status")) ? "Cảnh báo" : "Bình thường", r.get("timestamp"));
        });
    }

    // ------------------------------------------------------------------ helpers

    private Map<String, String> unitsByType() {
        Map<String, String> units = new HashMap<>(Map.of("temperature", "°C", "light", "Lx", "humidity", "%"));
        jdbc.query("SELECT sensor_type, unit FROM sensors WHERE status = 'active'", rs -> {
            units.put(rs.getString("sensor_type"), rs.getString("unit"));
        });
        return units;
    }

    private static Map<String, Object> newPoint(String time, Instant at) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("time", time);
        p.put("temperature", null);
        p.put("light", null);
        p.put("humidity", null);
        p.put("recorded_at", at);
        return p;
    }

    /** "#003" - dinh dang ma ban ghi nhu SRS (toi thieu 3 chu so). */
    static String formatId(long id) {
        return "#" + String.format("%03d", id);
    }

    static BigDecimal num(BigDecimal v) {
        return v == null ? null : v.stripTrailingZeros();
    }

    private static BigDecimal round(BigDecimal v, int scale) {
        return v == null ? null : v.setScale(scale, RoundingMode.HALF_UP).stripTrailingZeros();
    }

    private static String plain(Object v) {
        return v instanceof BigDecimal b ? b.toPlainString() : v == null ? "" : v.toString();
    }
}
