package com.iothub.mqtt;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iothub.config.MqttProperties;
import com.iothub.device.DeviceResponseService;
import com.iothub.sensor.SensorIngestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Phan phoi message MQTT nhan duoc toi service tuong ung theo topic. */
@Component
public class MqttInboundHandler {

    private static final Logger log = LoggerFactory.getLogger(MqttInboundHandler.class);

    private final ObjectMapper mapper;
    private final MqttProperties props;
    private final SensorIngestService sensorIngest;
    private final DeviceResponseService deviceResponse;

    public MqttInboundHandler(ObjectMapper mapper, MqttProperties props, SensorIngestService sensorIngest,
                              DeviceResponseService deviceResponse) {
        this.mapper = mapper;
        this.props = props;
        this.sensorIngest = sensorIngest;
        this.deviceResponse = deviceResponse;
    }

    public void handle(String topic, String payload) {
        try {
            if (props.topics().sensorData().equals(topic)) {
                sensorIngest.ingest(mapper.readValue(payload, SensorDataMessage.class));
            } else if (props.topics().deviceResponse().equals(topic)) {
                deviceResponse.process(mapper.readValue(payload, DeviceResponseMessage.class));
            } else {
                log.debug("[MQTT] Bo qua topic khong xu ly: {}", topic);
            }
        } catch (JsonProcessingException e) {
            log.warn("[MQTT] Payload JSON khong hop le tren topic {}: {}", topic, e.getOriginalMessage());
        } catch (Exception e) {
            log.error("[MQTT] Loi xu ly message topic {}: {}", topic, payload, e);
        }
    }
}
