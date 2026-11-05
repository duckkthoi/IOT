package com.iothub.mqtt;

/**
 * Payload topic device_response (SRS B.5.3):
 * { "action_id", "device_code", "status": "success"|"error", "current_state", "brightness", "timestamp" }
 * + cac truong firmware bo sung: "mode" (MANUAL|BLINK), "interval_ms", "message" (khi loi).
 */
public record DeviceResponseMessage(
        Long actionId,
        String deviceCode,
        String status,
        String currentState,
        Integer brightness,
        String mode,
        Integer intervalMs,
        String message,
        String timestamp
) {
    public boolean isSuccess() {
        return "success".equalsIgnoreCase(status);
    }
}
