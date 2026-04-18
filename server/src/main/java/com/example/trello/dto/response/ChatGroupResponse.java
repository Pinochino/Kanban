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
public class ChatGroupResponse {

    Long id;
    String name;
    String description;
    Long creatorId;
    String creatorName;
    long memberCount;
    String lastMessagePreview;
    LocalDateTime lastMessageAt;
    LocalDateTime createdAt;
}