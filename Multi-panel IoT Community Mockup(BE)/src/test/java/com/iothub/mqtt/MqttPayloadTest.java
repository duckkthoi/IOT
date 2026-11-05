package com.iothub.mqtt;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Doi chieu payload MQTT voi dung JSON ma firmware IoT_Community_Hub_led_manually.ino gui / nhan.
 * ObjectMapper cau hinh giong Spring (SNAKE_CASE, bo qua truong la).
 */
class MqttPayloadTest {

    private final ObjectMapper mapper = new ObjectMapper()
            .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Test
    void parsesFirmwareSensorData() throws Exception {
        String json = """
                {"device_mac":"48:3F:DA:12:34:56","readings":[
                  {"sensor_code":"TEMP-01","value":28.5},
                  {"sensor_code":"HUM-01","value":65},
                  {"sensor_code":"LIGHT-01","value":847,"unit":"ADC"}],
                 "timestamp":"2026-08-16T08:35:11Z"}""";
        SensorDataMessage msg = mapper.readValue(json, SensorDataMessage.class);
        assertEquals("48:3F:DA:12:34:56", msg.deviceMac());
        assertEquals(3, msg.readings().size());
        assertEquals(new BigDecimal("28.5"), msg.readings().get(0).value());
        assertEquals("ADC", msg.readings().get(2).unit());
        assertEquals("2026-08-16T08:35:11Z", msg.timestamp());
    }

    @Test
    void serializesControlWithoutNullIntervalForOnOff() throws Exception {
        String json = mapper.writeValueAsString(new DeviceControlMessage(8452, "LED-01", "ON", 80, null));
        assertEquals("{\"action_id\":8452,\"device_code\":\"LED-01\",\"action\":\"ON\",\"brightness\":80}", json);
    }

    @Test
    void serializesBlinkWithInterval() throws Exception {
        String json = mapper.writeValueAsString(new DeviceControlMessage(9, "LED-02", "BLINK", 50, 500));
        assertTrue(json.contains("\"interval_ms\":500"));
    }

    @Test
    void parsesFirmwareResponses() throws Exception {
        DeviceResponseMessage ok = mapper.readValue("""
                {"action_id":8452,"device_code":"LED-01","status":"success","current_state":"ON",
                 "brightness":80,"mode":"MANUAL","timestamp":"2026-08-16T08:35:13Z"}""", DeviceResponseMessage.class);
        assertTrue(ok.isSuccess());
        assertEquals(8452L, ok.actionId());
        assertEquals(80, ok.brightness());

        DeviceResponseMessage err = mapper.readValue("""
                {"action_id":12,"device_code":"LED-09","status":"error",
                 "message":"device_code phai la LED-01, LED-02 hoac LED-03","timestamp":null}""", DeviceResponseMessage.class);
        assertFalse(err.isSuccess());
        assertNull(err.currentState());
        assertEquals("device_code phai la LED-01, LED-02 hoac LED-03", err.message());
    }
}
