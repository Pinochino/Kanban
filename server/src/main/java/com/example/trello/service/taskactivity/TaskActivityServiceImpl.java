package com.example.trello.service.taskactivity;

import com.example.trello.constants.ActionType;
import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.AccountAssignedProjectResponse;
import com.example.trello.dto.response.TaskActivityResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.Task;
import com.example.trello.model.TaskActivity;
import com.example.trello.repository.TaskActivityRepository;
import com.example.trello.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskActivityServiceImpl implements TaskActivityService {

    TaskActivityRepository taskActivityRepository;
    TaskRepository taskRepository;

    @Override
    public List<TaskActivityResponse> getTaskActivitiesByTaskId(Long taskId) {
        taskRepository.findById(taskId).orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        return taskActivityRepository.findAllByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void log(Task task, Account account, ActionType actionType, String detail) {
        if (task == null || account == null || actionType == null) {
            return;
        }

        TaskActivity activity = TaskActivity.builder()
                .task(task)
                .account(account)
                .actionType(actionType)
                .detail(detail)
                .build();

        taskActivityRepository.save(activity);
    }

    @Override
    public void deleteByTaskId(Long taskId) {
        taskActivityRepository.deleteByTaskId(taskId);
    }

    @Override
    public void deleteAll() {
        taskActivityRepository.deleteAll();
    }

    private TaskActivityResponse toResponse(TaskActivity activity) {
        AccountAssignedProjectResponse actor = activity.getAccount() == null
                ? null
                : new AccountAssignedProjectResponse(activity.getAccount().getId(), activity.getAccount().getUsername());

        return TaskActivityResponse.builder()
                .id(activity.getId())
                .taskId(activity.getTask() != null ? activity.getTask().getId() : null)
                .actionType(activity.getActionType())
                .detail(activity.getDetail())
                .account(actor)
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}