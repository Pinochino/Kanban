package com.example.trello.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class TaskRequest {

    String title;

    String description;

    Long orderIndex;

    LocalDateTime dueDate;

    LocalDateTime reminderDate;
}
