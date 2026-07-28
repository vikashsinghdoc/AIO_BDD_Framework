package com.testplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class LogBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(LogBroadcastService.class);

    /** Live subscribers per run id. */
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /** Rolling buffer of everything emitted so far, so late subscribers can catch up. */
    private final Map<Long, StringBuilder> buffers = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long runId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout; client disconnects when done
        emitters.computeIfAbsent(runId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        // Replay what's already happened so the console isn't empty on join.
        String backlog = buffers.getOrDefault(runId, new StringBuilder()).toString();
        if (!backlog.isEmpty()) {
            try {
                emitter.send(SseEmitter.event().name("log").data(backlog));
            } catch (IOException ex) {
                emitter.completeWithError(ex);
            }
        }

        emitter.onCompletion(() -> removeEmitter(runId, emitter));
        emitter.onTimeout(() -> removeEmitter(runId, emitter));
        emitter.onError(ex -> removeEmitter(runId, emitter));
        return emitter;
    }

    public void publish(Long runId, String line) {
        buffers.computeIfAbsent(runId, id -> new StringBuilder()).append(line).append("\n");
        List<SseEmitter> subscribers = emitters.get(runId);
        if (subscribers == null) return;
        for (SseEmitter emitter : subscribers) {
            try {
                emitter.send(SseEmitter.event().name("log").data(line));
            } catch (IOException | IllegalStateException ex) {
                removeEmitter(runId, emitter);
            }
        }
    }

    public void complete(Long runId, String status) {
        List<SseEmitter> subscribers = emitters.get(runId);
        if (subscribers != null) {
            for (SseEmitter emitter : subscribers) {
                try {
                    emitter.send(SseEmitter.event().name("done").data(status));
                    emitter.complete();
                } catch (IOException | IllegalStateException ex) {
                    log.debug("Emitter already closed for run {}", runId);
                }
            }
        }
        emitters.remove(runId);
        buffers.remove(runId);
    }

    private void removeEmitter(Long runId, SseEmitter emitter) {
        List<SseEmitter> subscribers = emitters.get(runId);
        if (subscribers != null) subscribers.remove(emitter);
    }
}
