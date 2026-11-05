package com.iothub.sensor;

import com.iothub.common.ActiveStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/** Bang sensors (SRS 3.4.2). */
@Entity
@Table(name = "sensors")
public class Sensor {

    @Id
    @Column(name = "sensor_id")
    private Integer sensorId;

    @Column(name = "sensor_code", nullable = false, length = 30)
    private String sensorCode;

    @Column(name = "sensor_name", nullable = false, length = 100)
    private String sensorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sensor_type", nullable = false)
    private SensorType sensorType;

    @Column(nullable = false, length = 10)
    private String unit;

    @Column(length = 100)
    private String location;

    @Column(name = "min_threshold", precision = 10, scale = 2)
    private BigDecimal minThreshold;

    @Column(name = "max_threshold", precision = 10, scale = 2)
    private BigDecimal maxThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActiveStatus status = ActiveStatus.active;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public Integer getSensorId() { return sensorId; }
    public String getSensorCode() { return sensorCode; }
    public String getSensorName() { return sensorName; }
    public void setSensorName(String sensorName) { this.sensorName = sensorName; }
    public SensorType getSensorType() { return sensorType; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public BigDecimal getMinThreshold() { return minThreshold; }
    public void setMinThreshold(BigDecimal minThreshold) { this.minThreshold = minThreshold; }
    public BigDecimal getMaxThreshold() { return maxThreshold; }
    public void setMaxThreshold(BigDecimal maxThreshold) { this.maxThreshold = maxThreshold; }
    public ActiveStatus getStatus() { return status; }
    public void setStatus(ActiveStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean isActive() {
        return status == ActiveStatus.active;
    }

    /** So sanh voi min_threshold / max_threshold -> 'normal' | 'warning' (SRS B.5.1). */
    public String evaluate(BigDecimal value) {
        boolean low = minThreshold != null && value.compareTo(minThreshold) < 0;
        boolean high = maxThreshold != null && value.compareTo(maxThreshold) > 0;
        return low || high ? "warning" : "normal";
    }
}
