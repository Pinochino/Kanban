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
public class ChatContactResponse {

    Long id;
    String username;
    String email;
    String avatarUrl;
    String roleName;
    long unreadCount;
    LocalDateTime lastMessageAt;
    String lastMessagePreview;
}
