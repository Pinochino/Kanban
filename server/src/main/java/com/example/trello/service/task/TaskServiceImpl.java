package com.example.trello.service.task;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.TaskMapper;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Task;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ListTaskRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.utils.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    TaskRepository taskRepository;
    AccountRepository accountRepository;
    ListTaskRepository listTaskRepository;
    JwtUtil jwtUtil;
    TaskMapper taskMapper;

    @Transactional
    @Override
    public TaskResponse createTask(
            TaskRequest taskRequest
    ) {
        Optional<Task> task = taskRepository.findByTitle(taskRequest.getTitle());

        if (task.isPresent()) {
            throw new AppError(ErrorCode.TASK_ALREADY_EXIST);
        }

        Account account = accountRepository
                .findById(taskRequest.getAssignedAccountId())
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        ListTask listTask = listTaskRepository
                .findById(taskRequest.getListTaskId())
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        Task newTask = taskMapper.toTask(taskRequest);
        newTask.setActive(true);
        newTask.setAssignedAccount(account);
        newTask.setListTask(listTask);

        newTask = taskRepository.save(newTask);

        return taskMapper.toTaskResponse(newTask);
    }

    @Override
    public List<TaskResponse> getTasks(
            Long assignedAccountId,
            Long listTaskId
    ) {
        Account account = accountRepository.findById(assignedAccountId).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        ListTask listTask = listTaskRepository.findById(listTaskId).orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        List<Task> tasks = taskRepository.findTaskByAssignedAccountAndListTask(account, listTask);

        return tasks.stream()
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TaskResponse getTask(
            Long taskId
    ) {
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));
        return taskMapper.toTaskResponse(task);
    }

    @Transactional
    @Override
    public void deleteTask(
            Long taskId,
            Long assignedAccountId,
            Long listTaskId
    ) {
        Account account = accountRepository
                .findById(assignedAccountId)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        Task task = taskRepository
                .findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        ListTask listTask = listTaskRepository
                .findById(listTaskId)
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        account.getTasks().remove(task);
        listTask.getTasks().remove(task);
        taskRepository.delete(task);
    }

    @Transactional
    @Override
    public void deleteTasks(
            Long listTaskId,
            Long assignedAccountId
    ) {
        Account account = accountRepository
                .findById(assignedAccountId)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        ListTask listTask = listTaskRepository
                .findById(listTaskId)
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        account.getTasks().clear();
        listTask.getTasks().clear();
        taskRepository.deleteAll();
    }

    @Transactional
    @Override
    public TaskResponse updateTask(
            Long taskId,
            TaskRequest taskRequest) {

        Task task = taskRepository
                .findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        Account account = accountRepository
                .findById(taskRequest.getAssignedAccountId())
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        ListTask listTask = listTaskRepository
                .findById(taskRequest.getListTaskId())
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        taskMapper.updateTask(task, taskRequest);
        task.setAssignedAccount(account);
        task.setListTask(listTask);

        task = taskRepository.save(task);

        return taskMapper.toTaskResponse(task);
    }

    @Transactional
    @Override
    public void updateTaskStatus(
            Long taskId,
            Long listTaskId
    ) {
        Task task = taskRepository
                .findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        ListTask listTask = listTaskRepository
                .findById(listTaskId)
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        task.setListTask(listTask);
        taskRepository.save(task);
    }


}
