package com.iothub.mqtt;

import java.math.BigDecimal;
import java.util.List;

/**
 * Payload topic sensor_data (SRS B.5.1), firmware gui moi 5 giay:
 * <pre>
 * { "device_mac": "AA:BB:CC:DD:EE:FF",
 *   "readings": [ { "sensor_code": "TEMP-01", "value": 28.5 },
 *                 { "sensor_code": "HUM-01", "value": 65 },
 *                 { "sensor_code": "LIGHT-01", "value": 847, "unit": "ADC" } ],
 *   "timestamp": "2026-08-16T08:35:11Z" }
 * </pre>
 * Firmware bo qua TEMP-01/HUM-01 khi DHT doc loi, nen readings co the chi co LIGHT-01.
 */
public record SensorDataMessage(String deviceMac, List<Reading> readings, String timestamp) {

    public record Reading(String sensorCode, BigDecimal value, String unit) {}
}
