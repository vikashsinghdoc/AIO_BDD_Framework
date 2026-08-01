package com.testplatform.controller;

import com.testplatform.domain.Attachment;
import com.testplatform.dto.AttachmentDto;
import com.testplatform.repository.AttachmentRepository;
import com.testplatform.security.AttachmentCipher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;
    private final AttachmentCipher attachmentCipher;

    public AttachmentController(AttachmentRepository attachmentRepository, AttachmentCipher attachmentCipher) {
        this.attachmentRepository = attachmentRepository;
        this.attachmentCipher = attachmentCipher;
    }

    /** Decoded (decrypted) image/binary bytes for a single attachment. */
    @GetMapping("/api/attachments/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        Attachment attachment = attachmentRepository.findById(id).orElse(null);
        if (attachment == null) return ResponseEntity.notFound().build();

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(attachment.getMimeType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        byte[] plaintext = attachmentCipher.decrypt(attachment.getData());

        return ResponseEntity.ok()
                .contentType(mediaType)
                // Attachments are immutable once written, but keep caching modest —
                // decrypting is cheap and this avoids stale results if data is ever reprocessed.
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(plaintext);
    }

    /** Attachment metadata (no bytes) for a scenario — used by the Steps Explorer grid. */
    @GetMapping("/api/scenarios/{scenarioId}/attachments")
    public List<AttachmentDto> forScenario(@PathVariable Long scenarioId) {
        return attachmentRepository.findByScenarioId(scenarioId).stream()
                .map(AttachmentDto::from)
                .toList();
    }
}
