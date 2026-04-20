package com.example.trello.service.taskactivity;

import com.example.trello.constants.ActionType;
import com.example.trello.dto.response.TaskActivityResponse;
import com.example.trello.model.Account;
import com.example.trello.model.Task;
import jakarta.transaction.Transactional;

import java.util.List;

public interface TaskActivityService {

    List<TaskActivityResponse> getTaskActivitiesByTaskId(Long taskId);

    @Transactional
    void log(Task task, Account account, ActionType actionType, String detail);

    @Transactional
    void deleteByTaskId(Long taskId);

    @Transactional
    void deleteAll();
}