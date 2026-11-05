package com.iothub.mqtt;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Payload topic device_control (SRS B.5.2): { "action_id", "device_code", "action", "brightness" }.
 * Firmware ho tro them action = BLINK kem interval_ms (100..60000) va device_code = "ALL" (chi ON/OFF).
 * NON_NULL: firmware bao loi neu co "interval_ms": null.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeviceControlMessage(long actionId, String deviceCode, String action, int brightness, Integer intervalMs) {}
