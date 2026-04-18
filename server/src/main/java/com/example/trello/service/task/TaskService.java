package com.example.trello.service.task;

import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.dto.response.TaskResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public interface TaskService {
    @Transactional
    TaskResponse createTask(
            TaskRequest taskRequest
    );

    List<TaskResponse> getTasks(
            Long assignedAccountId,
            Long listTaskId
    );

    PagedResponse<TaskResponse> searchTasks(
            String status,
            String keyword,
            Long projectId,
            Long assignedAccountId,
            int page,
            int size
    );

    TaskResponse getTask(
            Long taskId
    );

    @Transactional
    void deleteTask(
            Long taskId,
            Long assignedAccountId,
            Long listTaskId
    );

    @Transactional
    void deleteTasks(
            Long listTaskId,
            Long assignedAccountId
    );

    @Transactional
    TaskResponse updateTask(
            Long taskId,
            TaskRequest taskRequest);

    @Transactional
    void updateTaskStatus(
            Long taskId,
            Long listTaskId
    );
}
