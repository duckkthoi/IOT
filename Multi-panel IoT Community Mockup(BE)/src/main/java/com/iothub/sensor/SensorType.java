package com.iothub.sensor;

/** ENUM('temperature','humidity','light'). Ten hang = gia tri trong DB. */
public enum SensorType {
    temperature,
    humidity,
    light;

    public static SensorType parse(String value) {
        if (value == null) return null;
        for (SensorType t : values()) {
            if (t.name().equalsIgnoreCase(value.trim())) return t;
        }
        return null;
    }
}
