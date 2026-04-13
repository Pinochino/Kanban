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

    Long id;

    String title;

    String description;

    boolean isPublic;

    AccountCreateProjectResponse createdBy;

    // AccountAssignedProjectResponse assignedAccount;
    
    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
