package com.iothub.device;

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
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Tra cuu lich su dieu khien thiet bi - SRS B.4.3 / B.4.4 (UC5). Join device_actions + devices + users. */
@Service
public class DeviceActionQueryService {

    public record ActionFilter(String search, Integer deviceId, String device, String action, String status,
                               String source, TimeRange range, String sort) {}

    private static final String SELECT = """
            SELECT a.action_id, a.performed_at, a.device_id, dv.device_code, dv.device_name, a.action, a.brightness,
                   a.interval_ms, a.source, a.is_confirmed, a.result_status, a.response_message, a.confirmed_at,
                   a.user_id, u.full_name, u.username
            FROM device_actions a
            JOIN devices dv ON dv.device_id = a.device_id
            LEFT JOIN users u ON u.user_id = a.user_id
            """;

    private final NamedParameterJdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate exportJdbc;
    private final AppProperties props;

    public DeviceActionQueryService(NamedParameterJdbcTemplate jdbc, DataSource dataSource, AppProperties props) {
        this.jdbc = jdbc;
        JdbcTemplate streaming = new JdbcTemplate(dataSource);
        streaming.setFetchSize(Integer.MIN_VALUE);
        this.exportJdbc = new NamedParameterJdbcTemplate(streaming);
        this.props = props;
    }

    public PageResponse<Map<String, Object>> list(ActionFilter f, PageRequest page) {
        SqlWhere w = where(f);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM device_actions a JOIN devices dv ON dv.device_id = a.device_id "
                + "LEFT JOIN users u ON u.user_id = a.user_id" + w.whereSql(), w.params(), Long.class);
        w.param("limit", page.limit()).param("offset", page.offset());
        List<Map<String, Object>> data = jdbc.query(SELECT + w.whereSql() + order(f.sort()) + " LIMIT :limit OFFSET :offset",
                w.params(), (rs, i) -> row(rs));
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("search", f.search());
        filters.put("device_id", f.deviceId());
        filters.put("action", f.action());
        filters.put("status", f.status());
        filters.put("source", f.source());
        filters.put("time_range", f.range().key());
        return PageResponse.of(data, total == null ? 0 : total, page, filters);
    }

    public Map<String, Object> find(long actionId) {
        List<Map<String, Object>> rows = jdbc.query(SELECT + " WHERE a.action_id = :id",
                new MapSqlParameterSource("id", actionId), (rs, i) -> row(rs));
        if (rows.isEmpty()) throw ApiException.notFound("Không tìm thấy lệnh điều khiển");
        return rows.get(0);
    }

    public void export(ActionFilter f, CsvWriter csv) {
        csv.row("Mã bản ghi", "Thời gian", "Mã thiết bị", "Thiết bị", "Hành động", "Độ sáng (%)", "Trạng thái",
                "Người thực hiện", "Nguồn");
        SqlWhere w = where(f);
        exportJdbc.query(SELECT + w.whereSql() + order(f.sort()), w.params(), rs -> {
            Map<String, Object> r = row(rs);
            csv.row(r.get("id"), TimeFormat.format((Instant) r.get("performed_at"), TimeFormat.DATE_TIME, props.zone()),
                    r.get("device_code"), r.get("device_name"), r.get("action_label"), r.get("brightness"),
                    r.get("status_label"), r.get("performed_by"), r.get("source_label"));
        });
    }

    private SqlWhere where(ActionFilter f) {
        SqlWhere w = new SqlWhere();
        if (f.deviceId() != null) w.where("a.device_id = :device_id").param("device_id", f.deviceId());
        if (f.device() != null && !f.device().isBlank() && !"all".equalsIgnoreCase(f.device())) {
            w.where("(dv.device_code = :device OR dv.device_name = :device)").param("device", f.device().trim());
        }
        if (f.action() != null) w.where("a.action = :action").param("action", f.action());
        if (f.status() != null) w.where("a.result_status = :status").param("status", f.status());
        if (f.source() != null) w.where("a.source = :source").param("source", f.source());
        w.timeRange("a.performed_at", f.range());
        String q = f.search() == null ? "" : f.search().trim();
        if (!q.isEmpty()) {
            String digits = q.replaceFirst("^#?[Hh]?", "");
            String text = "(dv.device_code LIKE :q OR dv.device_name LIKE :q OR u.full_name LIKE :q OR u.username LIKE :q)";
            w.param("q", "%" + q + "%");
            if (digits.matches("\\d{1,18}")) {
                w.where("(a.action_id = :q_id OR " + text + ")").param("q_id", Long.parseLong(digits));
            } else {
                w.where(text);
            }
        }
        return w;
    }

    private static String order(String sort) {
        return "oldest".equals(sort)
                ? " ORDER BY a.performed_at ASC, a.action_id ASC"
                : " ORDER BY a.performed_at DESC, a.action_id DESC";
    }

    private Map<String, Object> row(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        long id = rs.getLong("action_id");
        Instant at = TimeFormat.toInstant(rs.getTimestamp("performed_at"));
        String action = rs.getString("action");
        String source = rs.getString("source");
        String status = rs.getString("result_status");
        String fullName = rs.getString("full_name");
        m.put("id", "#H" + String.format("%02d", id));
        m.put("action_id", id);
        m.put("performed_at", at);
        m.put("display_time", TimeFormat.format(at, TimeFormat.SHORT, props.zone()));
        m.put("device_id", rs.getInt("device_id"));
        m.put("device_code", rs.getString("device_code"));
        m.put("device_name", rs.getString("device_name"));
        m.put("action", action);
        m.put("action_label", switch (action) {
            case "ON" -> "BẬT";
            case "OFF" -> "TẮT";
            default -> "NHẤP NHÁY";
        });
        m.put("brightness", (Integer) rs.getObject("brightness", Integer.class));
        m.put("interval_ms", (Integer) rs.getObject("interval_ms", Integer.class));
        m.put("is_confirmed", rs.getBoolean("is_confirmed"));
        m.put("status", status);
        m.put("status_label", switch (status) {
            case "success" -> "Thành công";
            case "failed" -> "Thất bại";
            case "unconfirmed" -> "Chưa xác nhận";
            default -> "Đang xử lý";
        });
        m.put("message", rs.getString("response_message"));
        m.put("confirmed_at", TimeFormat.toInstant(rs.getTimestamp("confirmed_at")));
        m.put("user_id", (Integer) rs.getObject("user_id", Integer.class));
        m.put("performed_by", fullName != null ? fullName : switch (source) {
            case "schedule" -> "Lịch trình";
            case "auto" -> "Hệ thống";
            default -> "Không xác định";
        });
        m.put("source", source);
        m.put("source_label", switch (source) {
            case "auto" -> "Tự động";
            case "schedule" -> "Lịch trình";
            default -> "Thủ công";
        });
        return m;
    }
}
