package com.iothub.schedule;

import com.iothub.common.ActiveStatus;
import com.iothub.common.ApiException;
import com.iothub.config.AppProperties;
import com.iothub.device.Device;
import com.iothub.device.DeviceCommandService;
import com.iothub.device.DeviceCommandService.CommandSpec;
import com.iothub.device.DeviceEnums.ActionSource;
import com.iothub.device.DeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * Tac nhan "Bo lap lich" (SRS 3.1, UC3): kich hoat lenh device_control theo cron,
 * ghi device_actions voi source = 'schedule', user_id = NULL.
 */
@Service
@Order(2)
public class ScheduleService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ScheduleService.class);

    public record ScheduleRequest(Integer deviceId, String action, Integer brightness, Integer intervalMs,
                                  String cronExpression, String description, Boolean enabled) {}

    private final DeviceScheduleRepository schedules;
    private final DeviceRepository devices;
    private final DeviceCommandService commands;
    private final TaskScheduler scheduler;
    private final AppProperties props;
    private final Map<Integer, ScheduledFuture<?>> running = new ConcurrentHashMap<>();

    public ScheduleService(DeviceScheduleRepository schedules, DeviceRepository devices, DeviceCommandService commands,
                           TaskScheduler scheduler, AppProperties props) {
        this.schedules = schedules;
        this.devices = devices;
        this.commands = commands;
        this.scheduler = scheduler;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<DeviceSchedule> enabled = schedules.findByEnabledTrue();
        enabled.forEach(this::register);
        log.info("[SCHEDULE] Da nap {} lich trinh dang bat", enabled.size());
    }

    public List<Map<String, Object>> list() {
        return schedules.findAllByOrderByScheduleId().stream().map(this::view).toList();
    }

    public Map<String, Object> create(ScheduleRequest req, Integer userId) {
        DeviceSchedule s = new DeviceSchedule();
        s.setCreatedBy(userId);
        apply(s, req, true);
        s = schedules.save(s);
        register(s);
        return view(s);
    }

    public Map<String, Object> update(Integer id, ScheduleRequest req) {
        DeviceSchedule s = find(id);
        apply(s, req, false);
        s = schedules.save(s);
        register(s);
        return view(s);
    }

    public void delete(Integer id) {
        DeviceSchedule s = find(id);
        cancel(id);
        schedules.delete(s);
    }

    /** Chay ngay mot lich trinh (de thu nghiem). */
    public Map<String, Object> runNow(Integer id) {
        DeviceSchedule s = find(id);
        List<Map<String, Object>> fired = fire(s);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("schedule", view(find(id)));
        m.put("dispatched", fired);
        return m;
    }

    // ---------------------------------------------------------------------------------------------

    private void apply(DeviceSchedule s, ScheduleRequest req, boolean creating) {
        if (creating || req.deviceId() != null) {
            if (req.deviceId() != null) {
                devices.findById(req.deviceId()).orElseThrow(() -> ApiException.notFound("Không tìm thấy thiết bị"));
            }
            s.setDeviceId(req.deviceId());
        }
        if (creating || req.action() != null) {
            CommandSpec spec = commands.normalize(null, req.action(),
                    req.brightness() != null ? req.brightness() : s.getBrightness(),
                    req.intervalMs() != null ? req.intervalMs() : s.getIntervalMs());
            s.setAction(spec.action());
            s.setBrightness(spec.brightness());
            s.setIntervalMs(spec.intervalMs());
        } else if (req.brightness() != null || req.intervalMs() != null) {
            CommandSpec spec = commands.normalize(null, s.getAction().name(),
                    req.brightness() != null ? req.brightness() : s.getBrightness(),
                    req.intervalMs() != null ? req.intervalMs() : s.getIntervalMs());
            s.setBrightness(spec.brightness());
            s.setIntervalMs(spec.intervalMs());
        }
        if (creating || req.cronExpression() != null) {
            s.setCronExpression(normalizeCron(req.cronExpression()));
        }
        if (req.description() != null) s.setDescription(req.description().isBlank() ? null : req.description().trim());
        if (req.enabled() != null) s.setEnabled(req.enabled());
    }

    /** Chap nhan cron 5 truong kieu Unix ("0 18 * * *") hoac 6 truong kieu Spring ("0 0 18 * * *"). */
    static String normalizeCron(String cron) {
        if (cron == null || cron.isBlank()) throw ApiException.badRequest("Thiếu cron_expression");
        String c = cron.trim().replaceAll("\\s+", " ");
        if (c.split(" ").length == 5) c = "0 " + c;
        if (!CronExpression.isValidExpression(c)) {
            throw ApiException.badRequest("cron_expression không hợp lệ (vd. \"0 0 18 * * *\" = 18:00 hằng ngày)");
        }
        return c;
    }

    private void register(DeviceSchedule s) {
        cancel(s.getScheduleId());
        if (!s.isEnabled()) return;
        Integer id = s.getScheduleId();
        ScheduledFuture<?> f = scheduler.schedule(() -> {
            try {
                schedules.findById(id).filter(DeviceSchedule::isEnabled).ifPresent(this::fire);
            } catch (Exception e) {
                log.error("[SCHEDULE] Lich trinh #{} loi", id, e);
            }
        }, new CronTrigger(s.getCronExpression(), props.zone()));
        running.put(id, f);
    }

    private void cancel(Integer id) {
        ScheduledFuture<?> f = running.remove(id);
        if (f != null) f.cancel(false);
    }

    private List<Map<String, Object>> fire(DeviceSchedule s) {
        List<Device> targets = s.getDeviceId() == null
                ? devices.findByStatusOrderByDeviceId(ActiveStatus.active)
                : devices.findById(s.getDeviceId()).filter(Device::isActive).map(List::of).orElse(List.of());
        CommandSpec spec = new CommandSpec(s.getAction(), s.getBrightness() == null ? 0 : s.getBrightness(), s.getIntervalMs());
        List<Map<String, Object>> fired = new ArrayList<>();
        for (Device d : targets) {
            var dispatch = commands.dispatch(d, spec, null, ActionSource.schedule);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("device_code", d.getDeviceCode());
            m.put("action_id", dispatch.action().getActionId());
            m.put("sent", dispatch.sent());
            if (!dispatch.sent()) m.put("message", dispatch.error());
            fired.add(m);
        }
        s.setLastRunAt(Instant.now());
        schedules.save(s);
        log.info("[SCHEDULE] #{} {} -> {} thiet bi", s.getScheduleId(), s.getAction(), fired.size());
        return fired;
    }

    private DeviceSchedule find(Integer id) {
        return schedules.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy lịch trình"));
    }

    private Map<String, Object> view(DeviceSchedule s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("schedule_id", s.getScheduleId());
        m.put("device_id", s.getDeviceId());
        m.put("device_code", s.getDeviceId() == null ? "ALL"
                : devices.findById(s.getDeviceId()).map(Device::getDeviceCode).orElse(null));
        m.put("action", s.getAction().name());
        m.put("brightness", s.getBrightness());
        m.put("interval_ms", s.getIntervalMs());
        m.put("cron_expression", s.getCronExpression());
        m.put("description", s.getDescription());
        m.put("enabled", s.isEnabled());
        m.put("last_run_at", s.getLastRunAt());
        m.put("next_run_at", nextRun(s));
        m.put("created_by", s.getCreatedBy());
        m.put("created_at", s.getCreatedAt());
        return m;
    }

    private Instant nextRun(DeviceSchedule s) {
        if (!s.isEnabled()) return null;
        LocalDateTime next = CronExpression.parse(s.getCronExpression()).next(LocalDateTime.now(props.zone()));
        return next == null ? null : ZonedDateTime.of(next, props.zone()).toInstant();
    }
}
