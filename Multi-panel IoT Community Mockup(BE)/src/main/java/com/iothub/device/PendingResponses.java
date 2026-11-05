package com.iothub.device;

import com.iothub.mqtt.DeviceResponseMessage;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/** Cac lenh dang cho device_response, doi chieu theo action_id (SRS B.5.3). */
@Component
public class PendingResponses {

    private final Map<Long, CompletableFuture<DeviceResponseMessage>> pending = new ConcurrentHashMap<>();

    /** Phai dang ky TRUOC khi publish lenh de khong lo phan hoi den qua nhanh. */
    public CompletableFuture<DeviceResponseMessage> register(long actionId) {
        CompletableFuture<DeviceResponseMessage> f = new CompletableFuture<>();
        pending.put(actionId, f);
        f.whenComplete((r, e) -> pending.remove(actionId, f));
        return f;
    }

    public void complete(long actionId, DeviceResponseMessage response) {
        CompletableFuture<DeviceResponseMessage> f = pending.get(actionId);
        if (f != null) f.complete(response);
    }

    public void fail(long actionId, Throwable error) {
        CompletableFuture<DeviceResponseMessage> f = pending.get(actionId);
        if (f != null) f.completeExceptionally(error);
    }

    public void forget(long actionId) {
        pending.remove(actionId);
    }
}
