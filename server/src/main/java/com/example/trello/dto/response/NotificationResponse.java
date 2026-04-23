package com.example.trello.dto.response;

import com.example.trello.constants.NotificationChannel;
import com.example.trello.constants.NotificationStatus;
import com.example.trello.constants.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {

    Long id;

    Long recipientId;

    String recipientName;

    String recipientEmail;

    Long taskId;

    NotificationChannel channel;

    NotificationType type;

    NotificationStatus status;

    @JsonProperty("isRead")
    boolean isRead;

    int retryCount;

    String title;

    String message;

    LocalDateTime createdAt;

    LocalDateTime scheduledAt;

    LocalDateTime deliveredAt;
}
