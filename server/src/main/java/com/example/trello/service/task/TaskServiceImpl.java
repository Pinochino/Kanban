package com.example.trello.service.task;

import com.example.trello.constants.ActionType;
import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.ListTaskStatus;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.TaskMapper;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Notification;
import com.example.trello.model.Task;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ListTaskRepository;
import com.example.trello.repository.NotificationRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.service.notification.NotificationService;
import com.example.trello.service.taskattachment.TaskAttachmentService;
import com.example.trello.service.taskactivity.TaskActivityService;
import com.example.trello.utils.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Locale;
import java.util.Objects;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    TaskRepository taskRepository;
    AccountRepository accountRepository;
    ListTaskRepository listTaskRepository;
        NotificationRepository notificationRepository;
    JwtUtil jwtUtil;
    TaskMapper taskMapper;
        NotificationService notificationService;
        TaskAttachmentService taskAttachmentService;
        TaskActivityService taskActivityService;

    @Transactional
    @Override
    public TaskResponse createTask(
            TaskRequest taskRequest
    ) {
        validateTaskSchedule(taskRequest);

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
        newTask.setOrderIndex((long) taskRepository.countByListTask(listTask));

        newTask = taskRepository.save(newTask);
        Account actor = jwtUtil.getCurrentUserLogin();
        notificationService.notifyTaskAssigned(newTask, account, actor);
        taskActivityService.log(newTask, actor, ActionType.CREATE, "Created task '" + newTask.getTitle() + "'.");

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

        return sortTasks(tasks).stream()
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

        @Override
        public PagedResponse<TaskResponse> searchTasks(String status, String keyword, Long projectId, Long assignedAccountId, int page, int size) {
                ListTaskStatus normalizedStatus = parseStatus(status);
                int validatedPage = Math.max(page, 0);
                int validatedSize = Math.min(Math.max(size, 1), 100);

                Pageable pageable = PageRequest.of(validatedPage, validatedSize,
                                Sort.by(Sort.Order.asc("orderIndex"), Sort.Order.asc("id")));

                Page<Task> taskPage = taskRepository.searchTasks(normalizedStatus, keyword, projectId, assignedAccountId, pageable);
                List<TaskResponse> items = taskPage.getContent().stream()
                                .map(taskMapper::toTaskResponse)
                                .collect(Collectors.toList());

                return PagedResponse.<TaskResponse>builder()
                                .items(items)
                                .totalElements(taskPage.getTotalElements())
                                .totalPages(taskPage.getTotalPages())
                                .page(taskPage.getNumber())
                                .size(taskPage.getSize())
                                .hasNext(taskPage.hasNext())
                                .hasPrevious(taskPage.hasPrevious())
                                .build();
        }

        private ListTaskStatus parseStatus(String status) {
                if (status == null || status.trim().isEmpty()) {
                        return null;
                }

                String normalized = status.trim().toUpperCase(Locale.ROOT).replace('-', '_');
                if ("TODO".equals(normalized)) {
                        normalized = "TO_DO";
                }

                try {
                        return ListTaskStatus.valueOf(normalized);
                } catch (IllegalArgumentException exception) {
                        return null;
                }
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
        listTask.getTaskList().remove(task);
        clearNotificationsByTaskId(taskId);
        taskAttachmentService.deleteByTaskId(taskId);
        taskActivityService.deleteByTaskId(taskId);
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

        List<Long> taskIds = listTask.getTaskList().stream()
                .map(Task::getId)
                .filter(Objects::nonNull)
                .toList();

        account.getTasks().clear();
        listTask.getTaskList().clear();

        for (Long taskId : taskIds) {
            clearNotificationsByTaskId(taskId);
        }

        taskAttachmentService.deleteAll();
        taskActivityService.deleteAll();
        taskRepository.deleteAll();
    }

    @Transactional
    @Override
    public TaskResponse updateTask(
            Long taskId,
            TaskRequest taskRequest) {

        validateTaskSchedule(taskRequest);

        Task task = taskRepository
                .findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        Long previousAssignedAccountId = task.getAssignedAccount() != null ? task.getAssignedAccount().getId() : null;

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

        taskActivityService.log(task, jwtUtil.getCurrentUserLogin(), ActionType.EDIT, "Updated task information.");

        if (!Objects.equals(previousAssignedAccountId, account.getId())) {
            notificationService.notifyTaskAssigned(task, account, jwtUtil.getCurrentUserLogin());
        }

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

        Account currentAccount = jwtUtil.getCurrentUserLogin();

        if (!canManageTask(task, currentAccount)) {
            throw new AppError(ErrorCode.TASK_AUTHORIZED);
        }

        ListTask listTask = listTaskRepository
                .findById(listTaskId)
                .orElseThrow(() -> new AppError(ErrorCode.LIST_TASK_NOT_FOUND));

        String fromStatus = task.getListTask() != null ? String.valueOf(task.getListTask().getStatus()) : "UNKNOWN";
        String toStatus = String.valueOf(listTask.getStatus());

        task.setListTask(listTask);
        task.setOrderIndex((long) taskRepository.countByListTask(listTask));
        taskRepository.save(task);

        taskActivityService.log(task, currentAccount, ActionType.STATUS_CHANGE,
                "Moved status from " + fromStatus + " to " + toStatus + ".");
    }

        private boolean canManageTask(Task task, Account account) {
                if (account == null) {
                        return false;
                }

                boolean elevated = account.getRoles().stream()
                                .map(role -> role.getName())
                                .anyMatch(roleName -> roleName == RoleName.SUPER_ADMIN || roleName == RoleName.ADMIN);

                if (elevated) {
                        return true;
                }

                return task.getAssignedAccount() != null && Objects.equals(task.getAssignedAccount().getId(), account.getId());
        }

    private List<Task> sortTasks(List<Task> tasks) {
        return tasks.stream()
                .sorted(Comparator
                        .comparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(task -> task.getOrderIndex() == null ? Long.MAX_VALUE : task.getOrderIndex())
                        .thenComparing(task -> task.getId() == null ? Long.MAX_VALUE : task.getId()))
                .toList();
    }

        private void validateTaskSchedule(TaskRequest taskRequest) {
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime dueDate = taskRequest.getDueDate();
                LocalDateTime reminderDate = taskRequest.getReminderDate();

                if (dueDate != null && !dueDate.isAfter(now)) {
                        throw new AppError(ErrorCode.TASK_DUE_DATE_INVALID);
                }

                if (reminderDate != null && !reminderDate.isAfter(now)) {
                        throw new AppError(ErrorCode.TASK_REMINDER_DATE_INVALID);
                }

                if (reminderDate != null && dueDate != null && reminderDate.isAfter(dueDate)) {
                        throw new AppError(ErrorCode.TASK_REMINDER_AFTER_DUE_INVALID);
                }
        }

        private void clearNotificationsByTaskId(Long taskId) {
                List<Notification> notifications = notificationRepository.findByTaskId(taskId);
                if (notifications.isEmpty()) {
                        return;
                }

                for (Notification notification : notifications) {
                        notification.setTask(null);
                }
                notificationRepository.saveAll(notifications);
        }


}
