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
public class ChatMessageResponse {

    Long id;
    Long senderId;
    String senderName;
    String senderAvatarUrl;
    Long receiverId;
    String receiverName;
    String receiverAvatarUrl;
    Long groupId;
    String groupName;
    String content;
    boolean isRead;
    LocalDateTime createdAt;
}
