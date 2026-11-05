package com.iothub.schedule;

import com.iothub.device.DeviceEnums.Command;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Bang device_schedules (bo tro): lich trinh tu dong cua tac nhan "Bo lap lich". */
@Entity
@Table(name = "device_schedules")
public class DeviceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Integer scheduleId;

    /** NULL = ap dung cho tat ca LED dang hoat dong. */
    @Column(name = "device_id")
    private Integer deviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Command action;

    private Integer brightness;

    @Column(name = "interval_ms")
    private Integer intervalMs;

    /** Cron 6 truong cua Spring: giay phut gio ngay thang thu, vd "0 0 18 * * *" = 18:00 hang ngay. */
    @Column(name = "cron_expression", nullable = false, length = 100)
    private String cronExpression;

    private String description;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public Integer getScheduleId() { return scheduleId; }
    public Integer getDeviceId() { return deviceId; }
    public void setDeviceId(Integer deviceId) { this.deviceId = deviceId; }
    public Command getAction() { return action; }
    public void setAction(Command action) { this.action = action; }
    public Integer getBrightness() { return brightness; }
    public void setBrightness(Integer brightness) { this.brightness = brightness; }
    public Integer getIntervalMs() { return intervalMs; }
    public void setIntervalMs(Integer intervalMs) { this.intervalMs = intervalMs; }
    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(Instant lastRunAt) { this.lastRunAt = lastRunAt; }
    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
