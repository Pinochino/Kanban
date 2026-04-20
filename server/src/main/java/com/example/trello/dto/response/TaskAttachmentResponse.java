package com.example.trello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskAttachmentResponse {

    Long id;
    Long taskId;
    String fileName;
    String fileUrl;
    Long fileSize;
    String mimeType;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
