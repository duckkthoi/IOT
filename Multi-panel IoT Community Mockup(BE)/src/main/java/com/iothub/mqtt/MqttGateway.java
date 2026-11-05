package com.iothub.mqtt;

import com.iothub.config.AppProperties;
import com.iothub.config.MqttProperties;
import com.iothub.realtime.SseHub;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Backend dong vai tro MQTT Client (SRS 2.4.1):
 * subscribe sensor_data + device_response, publish device_control.
 * Neu broker chua chay, backend van khoi dong binh thuong va tu thu ket noi lai moi {@code mqtt.reconnect-interval}.
 */
@Component
public class MqttGateway implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(MqttGateway.class);

    private final MqttProperties props;
    private final AppProperties appProps;
    private final MqttInboundHandler inboundHandler;
    private final SseHub hub;

    private final ScheduledExecutorService connector = Executors.newSingleThreadScheduledExecutor(r -> daemon(r, "mqtt-connector"));
    /** Xu ly message tuan tu ngoai thread cua Paho (khong chan callback, giu thu tu message). */
    private final ExecutorService inbound = Executors.newSingleThreadExecutor(r -> daemon(r, "mqtt-inbound"));

    private volatile MqttClient client;
    private volatile boolean lastConnected;
    private volatile String lastError;
    private volatile Instant connectedSince;
    private volatile long failedAttempts;

    public MqttGateway(MqttProperties props, AppProperties appProps, MqttInboundHandler inboundHandler, SseHub hub) {
        this.props = props;
        this.appProps = appProps;
        this.inboundHandler = inboundHandler;
        this.hub = hub;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!props.enabled()) {
            log.warn("[MQTT] mqtt.enabled = false - khong ket noi broker");
            return;
        }
        if (appProps.simulator().enabled()) {
            log.warn("[MQTT] Dang bat che do gia lap (app.simulator.enabled = true) - khong ket noi broker");
            return;
        }
        try {
            String clientId = props.clientId() + "-" + UUID.randomUUID().toString().substring(0, 6);
            client = new MqttClient(props.brokerUrl(), clientId, new MemoryPersistence());
            client.setCallback(this);
            client.setTimeToWait(5000);
        } catch (MqttException e) {
            log.error("[MQTT] broker-url khong hop le '{}': {}", props.brokerUrl(), e.getMessage());
            return;
        }
        long interval = Math.max(1000, props.reconnectInterval().toMillis());
        connector.scheduleWithFixedDelay(this::ensureConnected, 0, interval, TimeUnit.MILLISECONDS);
    }

    private void ensureConnected() {
        MqttClient c = client;
        if (c == null || c.isConnected()) return;
        try {
            MqttConnectOptions opts = new MqttConnectOptions();
            opts.setCleanSession(true);
            opts.setAutomaticReconnect(false); // tu quan ly vong ket noi lai o tren
            opts.setConnectionTimeout(5);
            opts.setKeepAliveInterval(30);
            if (props.username() != null && !props.username().isBlank()) {
                opts.setUserName(props.username());
                opts.setPassword(props.password() == null ? new char[0] : props.password().toCharArray());
            }
            c.connect(opts);
            c.subscribe(new String[]{props.topics().sensorData(), props.topics().deviceResponse()},
                    new int[]{props.qos(), props.qos()});
            connectedSince = Instant.now();
            lastError = null;
            failedAttempts = 0;
            log.info("[MQTT] Da ket noi {} va subscribe [{}, {}]", props.brokerUrl(),
                    props.topics().sensorData(), props.topics().deviceResponse());
            statusChanged(true);
        } catch (MqttException e) {
            lastError = e.getMessage();
            failedAttempts++;
            // Tranh spam log khi broker chua bat: log lan dau va moi 12 lan thu (~1 phut)
            if (failedAttempts == 1 || failedAttempts % 12 == 0) {
                log.warn("[MQTT] Chua ket noi duoc {} (lan thu {}): {}", props.brokerUrl(), failedAttempts, e.getMessage());
            }
            try {
                if (c.isConnected()) c.disconnect();
            } catch (MqttException ignored) {
                // bo qua
            }
        }
    }

    public boolean isConnected() {
        MqttClient c = client;
        return c != null && c.isConnected();
    }

    public void publish(String topic, String payload) throws MqttException {
        MqttClient c = client;
        if (c == null || !c.isConnected()) throw new MqttException(MqttException.REASON_CODE_CLIENT_NOT_CONNECTED);
        MqttMessage msg = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
        msg.setQos(props.qos());
        msg.setRetained(false); // lenh cu khong duoc phat lai khi thiet bi ket noi lai
        c.publish(topic, msg);
        log.debug("[MQTT] -> {} {}", topic, payload);
    }

    public Map<String, Object> status() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled", props.enabled() && !appProps.simulator().enabled());
        m.put("connected", isConnected());
        m.put("broker_url", props.brokerUrl());
        m.put("connected_since", isConnected() ? connectedSince : null);
        m.put("last_error", lastError);
        m.put("topics", props.topics());
        return m;
    }

    // ---------------------------------------------------------------- MqttCallback

    @Override
    public void connectionLost(Throwable cause) {
        lastError = cause == null ? "connection lost" : cause.getMessage();
        log.warn("[MQTT] Mat ket noi broker: {} - se tu ket noi lai", lastError);
        statusChanged(false);
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        log.debug("[MQTT] <- {} {}", topic, payload);
        // Khong duoc nem exception o day (Paho se ngat ket noi) -> day sang executor rieng
        inbound.execute(() -> inboundHandler.handle(topic, payload));
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // QoS 1: broker da nhan lenh; xac nhan that su den tu topic device_response
    }

    private void statusChanged(boolean connected) {
        if (lastConnected == connected) return;
        lastConnected = connected;
        hub.broadcast("mqtt_status", status());
    }

    @PreDestroy
    public void stop() {
        connector.shutdownNow();
        inbound.shutdown();
        MqttClient c = client;
        if (c != null) {
            try {
                if (c.isConnected()) c.disconnect(2000);
                c.close();
            } catch (MqttException e) {
                log.debug("[MQTT] Loi khi dong client: {}", e.getMessage());
            }
        }
    }

    private static Thread daemon(Runnable r, String name) {
        Thread t = new Thread(r, name);
        t.setDaemon(true);
        return t;
    }
}
