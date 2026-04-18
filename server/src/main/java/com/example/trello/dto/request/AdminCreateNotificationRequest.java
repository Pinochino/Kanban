package com.example.trello.dto.request;

import com.example.trello.constants.NotificationChannel;
import com.example.trello.utils.LocalDateTimeOrDateDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCreateNotificationRequest {

    @NotNull(message = "INVALID_EXCEPTION")
    Long recipientAccountId;

    @NotBlank(message = "INVALID_EXCEPTION")
    String title;

    @NotBlank(message = "INVALID_EXCEPTION")
    String message;

    @NotEmpty(message = "INVALID_EXCEPTION")
    List<NotificationChannel> channels;

    @JsonDeserialize(using = LocalDateTimeOrDateDeserializer.class)
    LocalDateTime scheduledAt;
}
