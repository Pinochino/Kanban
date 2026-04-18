package com.example.trello.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendChatMessageRequest {

    @NotNull(message = "INVALID_EXCEPTION")
    Long receiverId;

    @NotBlank(message = "INVALID_EXCEPTION")
    String content;
}
