package com.example.trello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class TaskResponse {

    Long taskId;

    String title;

    String description;

    Long orderIndex;

    boolean isActive;

    LocalDateTime dueDate;

    LocalDateTime reminderDate;

}
