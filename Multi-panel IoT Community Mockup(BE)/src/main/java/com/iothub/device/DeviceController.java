package com.iothub.device;

import com.iothub.common.ActiveStatus;
import com.iothub.common.ApiException;
import com.iothub.common.CsvWriter;
import com.iothub.common.PageRequest;
import com.iothub.common.PageResponse;
import com.iothub.common.TimeRange;
import com.iothub.config.AppProperties;
import com.iothub.device.DeviceEnums.ActionSource;
import com.iothub.device.DeviceEnums.Command;
import com.iothub.device.DeviceEnums.ResultStatus;
import com.iothub.realtime.SseHub;
import com.iothub.security.AuthUser;
import com.iothub.security.CurrentUser;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Nhom API Thiet bi - SRS B.4 (UC1, UC3, UC5). */
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    /** Body cua B.4.2: { "action": "ON", "brightness": 80 } (+ interval_ms khi BLINK). */
    public record ControlRequest(String action, Integer brightness, Integer intervalMs) {}

    public record UpdateDeviceRequest(@Size(max = 100) String deviceName, @Size(max = 100) String location,
                                      ActiveStatus status) {}

    private final DeviceRepository devices;
    private final DeviceCommandService commands;
    private final DeviceActionQueryService actionQuery;
    private final SseHub hub;
    private final AppProperties props;

    public DeviceController(DeviceRepository devices, DeviceCommandService commands,
                            DeviceActionQueryService actionQuery, SseHub hub, AppProperties props) {
        this.devices = devices;
        this.commands = commands;
        this.actionQuery = actionQuery;
        this.hub = hub;
        this.props = props;
    }

    /** B.4.1 - danh sach thiet bi va trang thai hien tai. */
    @GetMapping
    public Map<String, Object> list() {
        List<Map<String, Object>> data = devices.findAllByOrderByDeviceId().stream().map(Device::toView).toList();
        return Map.of("success", true, "data", data);
    }

    @GetMapping("/{deviceId:\\d+}")
    public Map<String, Object> get(@PathVariable Integer deviceId) {
        return Map.of("success", true, "data", find(deviceId).toView());
    }

    /**
     * B.4.2 - gui lenh bat/tat/chinh do sang. Mac dinh cho device_response toi da 5s:
     * xac nhan -> 200 (is_confirmed = true); qua han -> 408. Them ?wait=false de tra ngay (is_confirmed = false).
     */
    @PutMapping("/{deviceId:\\d+}/control")
    public Map<String, Object> control(@PathVariable Integer deviceId, @RequestBody ControlRequest req,
                                       @RequestParam(required = false) Boolean wait, @CurrentUser AuthUser user) {
        return commands.control(deviceId, req.action(), req.brightness(), req.intervalMs(), user.userId(), wait);
    }

    /** Mo rong: bat / tat dong thoi tat ca LED. */
    @PutMapping("/control-all")
    public Map<String, Object> controlAll(@RequestBody ControlRequest req, @RequestParam(required = false) Boolean wait,
                                          @CurrentUser AuthUser user) {
        return commands.controlAll(req.action(), req.brightness(), user.userId(), wait);
    }

    /** Admin doi ten / vi tri / ngung su dung thiet bi. */
    @PatchMapping("/{deviceId:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public Map<String, Object> update(@PathVariable Integer deviceId, @Valid @RequestBody UpdateDeviceRequest req) {
        Device d = find(deviceId);
        if (req.deviceName() != null && !req.deviceName().isBlank()) d.setDeviceName(req.deviceName().trim());
        if (req.location() != null) d.setLocation(req.location().isBlank() ? null : req.location().trim());
        if (req.status() != null) d.setStatus(req.status());
        Device saved = devices.save(d);
        hub.broadcast("device_state", saved.toView());
        return Map.of("success", true, "data", saved.toView());
    }

    // ------------------------------------------------------------------ UC5

    /**
     * B.4.3 - lich su dieu khien. Tham so SRS: page, limit, search, device_id.
     * Mo rong: device (ma/ten), action (ON|OFF|BLINK), status (pending|success|failed|unconfirmed),
     * source (manual|auto|schedule), time_range/from/to, sort (newest|oldest).
     */
    @GetMapping("/actions")
    public PageResponse<Map<String, Object>> actions(@RequestParam(required = false) Integer page,
                                                     @RequestParam(required = false) Integer limit,
                                                     @RequestParam(required = false) String search,
                                                     @RequestParam(name = "device_id", required = false) Integer deviceId,
                                                     @RequestParam(required = false) String device,
                                                     @RequestParam(required = false) String action,
                                                     @RequestParam(required = false) String status,
                                                     @RequestParam(required = false) String source,
                                                     @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                                                     @RequestParam(required = false) String from,
                                                     @RequestParam(required = false) String to,
                                                     @RequestParam(defaultValue = "newest") String sort) {
        var f = filter(search, deviceId, device, action, status, source, timeRange, from, to, sort);
        return actionQuery.list(f, PageRequest.of(page, limit));
    }

    /** B.4.4 - cung tham so voi /actions, tra file CSV. */
    @GetMapping("/actions/export")
    public void exportActions(@RequestParam(required = false) String search,
                              @RequestParam(name = "device_id", required = false) Integer deviceId,
                              @RequestParam(required = false) String device,
                              @RequestParam(required = false) String action,
                              @RequestParam(required = false) String status,
                              @RequestParam(required = false) String source,
                              @RequestParam(name = "time_range", defaultValue = "all") String timeRange,
                              @RequestParam(required = false) String from,
                              @RequestParam(required = false) String to,
                              @RequestParam(defaultValue = "newest") String sort,
                              HttpServletResponse response) {
        var f = filter(search, deviceId, device, action, status, source, timeRange, from, to, sort);
        try (CsvWriter csv = CsvWriter.open(response, "lich_su_hoat_dong", props.zone())) {
            actionQuery.export(f, csv);
        }
    }

    /** Mo rong: xem trang thai xac nhan cua mot lenh (dung khi goi control voi ?wait=false). */
    @GetMapping("/actions/{actionId:\\d+}")
    public Map<String, Object> action(@PathVariable Long actionId) {
        return Map.of("success", true, "data", actionQuery.find(actionId));
    }

    private Device find(Integer deviceId) {
        return devices.findById(deviceId).orElseThrow(() -> ApiException.notFound("Không tìm thấy thiết bị"));
    }

    private DeviceActionQueryService.ActionFilter filter(String search, Integer deviceId, String device, String action,
                                                        String status, String source, String timeRange, String from,
                                                        String to, String sort) {
        String act = blankOrAll(action) ? null : parseEnum(Command.class, action.toUpperCase(Locale.ROOT), "action phải là ON | OFF | BLINK");
        String st = blankOrAll(status) ? null : parseEnum(ResultStatus.class, status.toLowerCase(Locale.ROOT),
                "status phải là pending | success | failed | unconfirmed");
        String src = blankOrAll(source) ? null : parseEnum(ActionSource.class, source.toLowerCase(Locale.ROOT),
                "source phải là manual | auto | schedule");
        return new DeviceActionQueryService.ActionFilter(search, deviceId, device, act, st, src,
                TimeRange.resolve(timeRange, from, to, props.zone()),
                sort == null ? "newest" : sort.trim().toLowerCase(Locale.ROOT));
    }

    private static boolean blankOrAll(String v) {
        return v == null || v.isBlank() || "all".equalsIgnoreCase(v.trim());
    }

    private static <E extends Enum<E>> String parseEnum(Class<E> type, String value, String message) {
        try {
            return Enum.valueOf(type, value.trim()).name();
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest(message);
        }
    }
}
