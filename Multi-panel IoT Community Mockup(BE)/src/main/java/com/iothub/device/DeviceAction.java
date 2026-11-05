package com.iothub.device;

import com.iothub.device.DeviceEnums.ActionSource;
import com.iothub.device.DeviceEnums.Command;
import com.iothub.device.DeviceEnums.ResultStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Bang device_actions (SRS 3.4.5) + cot mo rong interval_ms, result_status, response_message, confirmed_at. */
@Entity
@Table(name = "device_actions")
public class DeviceAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Long actionId;

    @Column(name = "device_id", nullable = false)
    private Integer deviceId;

    /** NULL neu hanh dong do he thong / lich trinh tu dong thuc hien. */
    @Column(name = "user_id")
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Command action;

    private Integer brightness;

    @Column(name = "interval_ms")
    private Integer intervalMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionSource source = ActionSource.manual;

    @Column(name = "is_confirmed", nullable = false)
    private boolean confirmed;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false)
    private ResultStatus resultStatus = ResultStatus.pending;

    @Column(name = "response_message")
    private String responseMessage;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "performed_at", nullable = false)
    private Instant performedAt;

    protected DeviceAction() {
    }

    public DeviceAction(Integer deviceId, Integer userId, Command action, Integer brightness, Integer intervalMs,
                        ActionSource source) {
        this.deviceId = deviceId;
        this.userId = userId;
        this.action = action;
        this.brightness = brightness;
        this.intervalMs = intervalMs;
        this.source = source;
        this.performedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    }

    public Long getActionId() { return actionId; }
    public Integer getDeviceId() { return deviceId; }
    public Integer getUserId() { return userId; }
    public Command getAction() { return action; }
    public Integer getBrightness() { return brightness; }
    public Integer getIntervalMs() { return intervalMs; }
    public ActionSource getSource() { return source; }
    public boolean isConfirmed() { return confirmed; }
    public ResultStatus getResultStatus() { return resultStatus; }
    public String getResponseMessage() { return responseMessage; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public Instant getPerformedAt() { return performedAt; }

    public void markSuccess() {
        this.confirmed = true;
        this.resultStatus = ResultStatus.success;
        this.responseMessage = null;
        this.confirmedAt = Instant.now();
    }

    public void markFailed(String message) {
        this.confirmed = false;
        this.resultStatus = ResultStatus.failed;
        this.responseMessage = message == null ? null : message.substring(0, Math.min(255, message.length()));
        this.confirmedAt = Instant.now();
    }
}
