package com.example.trello.dto.response;

import com.example.trello.constants.ListTaskStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListTaskResponse {

    Long id;

    ListTaskStatus status;

    List<TaskResponse> taskList;
}
