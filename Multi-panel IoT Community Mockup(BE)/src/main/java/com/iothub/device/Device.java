package com.iothub.device;

import com.iothub.common.ActiveStatus;
import com.iothub.device.DeviceEnums.Mode;
import com.iothub.device.DeviceEnums.PowerState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** Bang devices (SRS 3.4.3) + cot mo rong mode, blink_interval_ms. */
@Entity
@Table(name = "devices")
public class Device {

    @Id
    @Column(name = "device_id")
    private Integer deviceId;

    @Column(name = "device_code", nullable = false, length = 30)
    private String deviceCode;

    @Column(name = "device_name", nullable = false, length = 100)
    private String deviceName;

    @Column(name = "device_type", nullable = false)
    private String deviceType = "led";

    @Column(length = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false)
    private PowerState currentState = PowerState.OFF;

    @Column(nullable = false)
    private Integer brightness = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Mode mode = Mode.MANUAL;

    @Column(name = "blink_interval_ms")
    private Integer blinkIntervalMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActiveStatus status = ActiveStatus.active;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public Integer getDeviceId() { return deviceId; }
    public String getDeviceCode() { return deviceCode; }
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
    public String getDeviceType() { return deviceType; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public PowerState getCurrentState() { return currentState; }
    public void setCurrentState(PowerState currentState) { this.currentState = currentState; }
    public Integer getBrightness() { return brightness; }
    public void setBrightness(Integer brightness) { this.brightness = brightness; }
    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode; }
    public Integer getBlinkIntervalMs() { return blinkIntervalMs; }
    public void setBlinkIntervalMs(Integer blinkIntervalMs) { this.blinkIntervalMs = blinkIntervalMs; }
    public ActiveStatus getStatus() { return status; }
    public void setStatus(ActiveStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isActive() {
        return status == ActiveStatus.active;
    }

    /** Cau truc theo SRS B.4.1 + cac truong bo sung. */
    public Map<String, Object> toView() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("device_id", deviceId);
        m.put("device_code", deviceCode);
        m.put("device_name", deviceName);
        m.put("current_state", currentState.name());
        m.put("brightness", brightness);
        m.put("mode", mode.name());
        m.put("blink_interval_ms", blinkIntervalMs);
        m.put("device_type", deviceType);
        m.put("location", location);
        m.put("status", status.name());
        return m;
    }
}
