package com.iothub.schedule;

import com.iothub.security.AuthUser;
import com.iothub.security.CurrentUser;
import com.iothub.user.AuthDtos.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Quan ly lich trinh dieu khien LED (mo rong). Vi du body:
 * { "device_id": 1, "action": "ON", "brightness": 80, "cron_expression": "0 0 18 * * *", "description": "Bat den 18h" }
 * device_id = null -> ap dung tat ca LED.
 */
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService service;

    public ScheduleController(ScheduleService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "data", service.list());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> create(@RequestBody ScheduleService.ScheduleRequest req, @CurrentUser AuthUser user) {
        return Map.of("success", true, "data", service.create(req, user.userId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(@PathVariable Integer id, @RequestBody ScheduleService.ScheduleRequest req) {
        return Map.of("success", true, "data", service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse delete(@PathVariable Integer id) {
        service.delete(id);
        return MessageResponse.ok("Đã xoá lịch trình");
    }

    @PostMapping("/{id}/run")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> runNow(@PathVariable Integer id) {
        return service.runNow(id);
    }
}
