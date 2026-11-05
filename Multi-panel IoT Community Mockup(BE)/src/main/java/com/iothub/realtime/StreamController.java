package com.iothub.realtime;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * GET /api/stream?token=&lt;jwt&gt; - mo kenh SSE. Vi du phia Frontend:
 * <pre>
 * const es = new EventSource(`http://localhost:3000/api/stream?token=${token}`)
 * es.addEventListener('sensor_data', e => console.log(JSON.parse(e.data)))
 * </pre>
 */
@RestController
public class StreamController {

    private final SseHub hub;

    public StreamController(SseHub hub) {
        this.hub = hub;
    }

    @GetMapping(path = "/api/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return hub.subscribe();
    }
}
