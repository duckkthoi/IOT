package com.iothub.sensor;

import com.iothub.common.ActiveStatus;
import com.iothub.common.ApiException;
import com.iothub.common.CsvWriter;
import com.iothub.common.PageRequest;
import com.iothub.common.PageResponse;
import com.iothub.common.TimeRange;
import com.iothub.config.AppProperties;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Nhom API Cam bien - SRS B.3 (UC1, UC2, UC4). */
@RestController
@RequestMapping("/api/sensors")
public class SensorController {

    private final SensorQueryService query;
    private final SensorRepository sensors;
    private final AppProperties props;

    public SensorController(SensorQueryService query, SensorRepository sensors, AppProperties props) {
        this.query = query;
        this.sensors = sensors;
        this.props = props;
    }

    /** B.3.1 - gia tri moi nhat. ?trend=16 de kem chuoi xu huong ngan han cho tung the. */
    @GetMapping("/realtime")
    public Map<String, Object> realtime(@RequestParam(defaultValue = "0") int trend) {
        return Map.of("success", true, "data", query.realtime(trend));
    }

    /** Mo rong: N diem gan nhat cho bieu do LIVE (moi diem gom ca 3 cam bien). */
    @GetMapping("/live")
    public Map<String, Object> live(@RequestParam(defaultValue = "16") int points) {
        return Map.of("success", true, "series", query.live(points));
    }

    /** B.3.2 - range: today | week | month; type: all | temperature | humidity | light. */
    @GetMapping("/history")
    public Map<String, Object> history(@RequestParam(defaultValue = "today") String range,
                                       @RequestParam(defaultValue = "all") String type) {
        return query.history(range, type);
    }

    /** B.3.3 - bang du lieu (moi dong mot lan do gom 3 cam bien), loc thoi gian + trang thai. */
    @GetMapping("/data")
    public PageResponse<Map<String, Object>> data(@RequestParam(required = false) Integer page,
                                                  @RequestParam(required = false) Integer limit,
                                                  @RequestParam(required = false) String search,
                                                  @RequestParam(defaultValue = "all") String status,
                                                  @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                                                  @RequestParam(required = false) String from,
                                                  @RequestParam(required = false) String to,
                                                  @RequestParam(defaultValue = "newest") String sort) {
        return query.groupedData(filter(search, null, status, timeRange, from, to, null, sort), PageRequest.of(page, limit));
    }

    /** B.3.4 - cung tham so voi /data, tra file CSV. */
    @GetMapping("/data/export")
    public void exportData(@RequestParam(required = false) String search,
                           @RequestParam(defaultValue = "all") String status,
                           @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                           @RequestParam(required = false) String from,
                           @RequestParam(required = false) String to,
                           @RequestParam(defaultValue = "newest") String sort,
                           HttpServletResponse response) {
        var f = filter(search, null, status, timeRange, from, to, null, sort);
        try (CsvWriter csv = CsvWriter.open(response, "du_lieu_cam_bien", props.zone())) {
            query.exportGrouped(f, csv);
        }
    }

    /**
     * Mo rong cho trang "Du lieu cam bien" hien tai cua Frontend: moi dong la MOT lan do cua MOT cam bien.
     * type: all | temperature | humidity | light; search_by: auto | id | value | time;
     * sort: newest | oldest | value_desc | value_asc | id_asc | id_desc | type_asc | type_desc.
     */
    @GetMapping("/readings")
    public PageResponse<Map<String, Object>> readings(@RequestParam(required = false) Integer page,
                                                      @RequestParam(required = false) Integer limit,
                                                      @RequestParam(required = false) String search,
                                                      @RequestParam(name = "search_by", defaultValue = "auto") String searchBy,
                                                      @RequestParam(defaultValue = "all") String type,
                                                      @RequestParam(defaultValue = "all") String status,
                                                      @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                                                      @RequestParam(required = false) String from,
                                                      @RequestParam(required = false) String to,
                                                      @RequestParam(defaultValue = "newest") String sort) {
        return query.readings(filter(search, searchBy, status, timeRange, from, to, type, sort), PageRequest.of(page, limit));
    }

    @GetMapping("/readings/export")
    public void exportReadings(@RequestParam(required = false) String search,
                               @RequestParam(name = "search_by", defaultValue = "auto") String searchBy,
                               @RequestParam(defaultValue = "all") String type,
                               @RequestParam(defaultValue = "all") String status,
                               @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                               @RequestParam(required = false) String from,
                               @RequestParam(required = false) String to,
                               @RequestParam(defaultValue = "newest") String sort,
                               HttpServletResponse response) {
        var f = filter(search, searchBy, status, timeRange, from, to, type, sort);
        try (CsvWriter csv = CsvWriter.open(response, "sensor_readings", props.zone())) {
            query.exportReadings(f, csv);
        }
    }

    // ------------------------------------------------------------------ danh muc cam bien

    /** Danh muc cam bien kem nguong canh bao. */
    @GetMapping
    public Map<String, Object> list() {
        List<Map<String, Object>> data = sensors.findAll(Sort.by("sensorId")).stream().map(SensorController::view).toList();
        return Map.of("success", true, "data", data);
    }

    public record UpdateSensorRequest(
            @Size(max = 100) String sensorName,
            @Size(max = 100) String location,
            @Size(max = 10) String unit,
            BigDecimal minThreshold,
            BigDecimal maxThreshold,
            ActiveStatus status,
            Boolean clearMinThreshold,
            Boolean clearMaxThreshold
    ) {}

    /** Admin chinh ten / vi tri / don vi / nguong canh bao. Nguong moi chi ap dung cho du lieu den sau. */
    @PutMapping("/{sensorId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> update(@PathVariable Integer sensorId, @RequestBody @jakarta.validation.Valid UpdateSensorRequest req) {
        Sensor s = sensors.findById(sensorId).orElseThrow(() -> ApiException.notFound("Không tìm thấy cảm biến"));
        if (req.sensorName() != null && !req.sensorName().isBlank()) s.setSensorName(req.sensorName().trim());
        if (req.location() != null) s.setLocation(req.location().isBlank() ? null : req.location().trim());
        if (req.unit() != null && !req.unit().isBlank()) s.setUnit(req.unit().trim());
        if (req.minThreshold() != null) s.setMinThreshold(req.minThreshold());
        if (req.maxThreshold() != null) s.setMaxThreshold(req.maxThreshold());
        if (Boolean.TRUE.equals(req.clearMinThreshold())) s.setMinThreshold(null);
        if (Boolean.TRUE.equals(req.clearMaxThreshold())) s.setMaxThreshold(null);
        if (req.status() != null) s.setStatus(req.status());
        if (s.getMinThreshold() != null && s.getMaxThreshold() != null
                && s.getMinThreshold().compareTo(s.getMaxThreshold()) > 0) {
            throw ApiException.badRequest("min_threshold phải nhỏ hơn hoặc bằng max_threshold");
        }
        return Map.of("success", true, "data", view(sensors.save(s)));
    }

    private static Map<String, Object> view(Sensor s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sensor_id", s.getSensorId());
        m.put("sensor_code", s.getSensorCode());
        m.put("sensor_name", s.getSensorName());
        m.put("sensor_type", s.getSensorType().name());
        m.put("unit", s.getUnit());
        m.put("location", s.getLocation());
        m.put("min_threshold", SensorQueryService.num(s.getMinThreshold()));
        m.put("max_threshold", SensorQueryService.num(s.getMaxThreshold()));
        m.put("status", s.getStatus().name());
        m.put("created_at", s.getCreatedAt());
        return m;
    }

    private SensorQueryService.DataFilter filter(String search, String searchBy, String status, String timeRange,
                                                 String from, String to, String type, String sort) {
        String st = status == null ? "all" : status.trim().toLowerCase(Locale.ROOT);
        if (!List.of("all", "normal", "warning").contains(st)) {
            throw ApiException.badRequest("status phải là all | normal | warning");
        }
        SensorType sensorType = null;
        if (type != null && !"all".equalsIgnoreCase(type.trim())) {
            sensorType = SensorType.parse(type);
            if (sensorType == null) throw ApiException.badRequest("type phải là all | temperature | humidity | light");
        }
        String sb = searchBy == null ? null : searchBy.trim().toLowerCase(Locale.ROOT);
        String so = sort == null ? "newest" : sort.trim().toLowerCase(Locale.ROOT);
        return new SensorQueryService.DataFilter(TimeRange.resolve(timeRange, from, to, props.zone()), st, search, sb, sensorType, so);
    }
}
