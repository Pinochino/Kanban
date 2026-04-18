package com.example.trello.dto.request;

import com.example.trello.utils.LocalDateTimeOrDateDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
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

    @JsonDeserialize(using = LocalDateTimeOrDateDeserializer.class)
    LocalDateTime dueDate;

    @JsonDeserialize(using = LocalDateTimeOrDateDeserializer.class)
    LocalDateTime reminderDate;

    Long assignedAccountId;

    Long listTaskId;

}
