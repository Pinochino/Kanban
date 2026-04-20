package com.example.trello.dto.response;

import com.example.trello.constants.ActionType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class TaskActivityResponse {

    Long id;
    Long taskId;
    ActionType actionType;
    String detail;
    AccountAssignedProjectResponse account;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}