package com.example.trello.service.taskattachment;

import org.springframework.core.io.Resource;

public record TaskAttachmentDownloadData(
        Resource resource,
        String fileName,
        String mimeType,
        long fileSize
) {
}
