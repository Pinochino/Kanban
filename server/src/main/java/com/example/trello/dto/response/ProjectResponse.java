package com.example.trello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectResponse {

    Long projectId;

    String title;

    String description;

    boolean isPublic;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
