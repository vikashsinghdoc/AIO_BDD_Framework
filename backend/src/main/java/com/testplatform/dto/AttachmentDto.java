package com.testplatform.dto;

import com.testplatform.domain.Attachment;

public record AttachmentDto(Long id, String mimeType, String stepKeyword) {
    public static AttachmentDto from(Attachment attachment) {
        return new AttachmentDto(attachment.getId(), attachment.getMimeType(), attachment.getStepKeyword());
    }
}
