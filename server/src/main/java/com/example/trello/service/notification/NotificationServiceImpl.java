package com.example.trello.service.notification;

import com.example.trello.constants.*;
import com.example.trello.dto.request.AdminCreateNotificationRequest;
import com.example.trello.dto.response.NotificationResponse;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.Notification;
import com.example.trello.model.Task;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.NotificationRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.service.mail.MailService;
import com.example.trello.utils.JwtUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationServiceImpl implements NotificationService {

    NotificationRepository notificationRepository;
    MailService mailService;
    JwtUtil jwtUtil;
    AccountRepository accountRepository;
    TaskRepository taskRepository;

    @Override
    public void notifyTaskAssigned(Task task, Account assignee, Account assignedBy) {
        if (task == null || assignee == null) {
            return;
        }

        String assignedByName = assignedBy != null && assignedBy.getUsername() != null
                ? assignedBy.getUsername()
                : "Admin";

        String title = "New task assigned";
        String message = "You have been assigned task '" + task.getTitle() + "' by " + assignedByName + ".";

        Notification webNotification = Notification.builder()
                .recipientAccount(assignee)
                .task(task)
                .channel(NotificationChannel.WEB)
                .type(NotificationType.TASK_ASSIGNED)
                .status(NotificationStatus.SENT)
                .title(title)
                .message(message)
            .scheduledAt(LocalDateTime.now())
            .deliveredAt(LocalDateTime.now())
                .build();

        notificationRepository.save(webNotification);

        Notification emailNotification = Notification.builder()
                .recipientAccount(assignee)
                .task(task)
                .channel(NotificationChannel.EMAIL)
                .type(NotificationType.TASK_ASSIGNED)
                .status(NotificationStatus.PENDING)
                .title(title)
                .message(message)
            .scheduledAt(LocalDateTime.now())
                .build();

        emailNotification = notificationRepository.save(emailNotification);

        try {
            mailService.sendSimpleMessage(
                    assignee.getEmail(),
                    "Task assignment reminder",
                    assignee.getUsername(),
                    message
            );

            emailNotification.setStatus(NotificationStatus.SENT);
            emailNotification.setDeliveredAt(LocalDateTime.now());
            notificationRepository.save(emailNotification);
        } catch (Exception exception) {
            emailNotification.setStatus(NotificationStatus.FAILED);
            emailNotification.setRetryCount(emailNotification.getRetryCount() + 1);
            notificationRepository.save(emailNotification);
        }
    }

    @Override
    public void createAdminNotification(AdminCreateNotificationRequest request) {
        assertAdmin();

        Account recipient = accountRepository.findById(request.getRecipientAccountId())
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime scheduledAt = request.getScheduledAt() == null ? now : request.getScheduledAt();

        List<Notification> notifications = new ArrayList<>();
        for (NotificationChannel channel : request.getChannels()) {
            Notification notification = Notification.builder()
                    .recipientAccount(recipient)
                    .channel(channel)
                    .type(NotificationType.ADMIN_MESSAGE)
                    .status(NotificationStatus.PENDING)
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .scheduledAt(scheduledAt)
                    .build();

            notifications.add(notificationRepository.save(notification));
        }

        if (!scheduledAt.isAfter(now)) {
            notifications.forEach(this::dispatchNotification);
        }
    }

    @Override
        public PagedResponse<NotificationResponse> getAdminNotifications(String channel,
                                         String status,
                                         String type,
                                         Long recipientId,
                                         String keyword,
                                         int page,
                                         int size) {
        assertAdmin();
        processDueScheduledNotifications();

        NotificationChannel parsedChannel = parseChannel(channel);
        NotificationStatus parsedStatus = parseStatus(status);
        NotificationType parsedType = parseType(type);
        String normalizedKeyword = keyword == null || keyword.trim().isEmpty() ? null : keyword.trim();
        String keywordPattern = normalizedKeyword == null
            ? null
            : "%" + normalizedKeyword.toLowerCase(Locale.ROOT) + "%";
        int validatedPage = Math.max(page, 0);
        int validatedSize = Math.min(Math.max(size, 1), 100);

        Pageable pageable = PageRequest.of(validatedPage, validatedSize,
            Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));

        Page<Notification> notificationPage = notificationRepository.searchAdminNotifications(
            recipientId,
            parsedChannel,
            parsedStatus,
            parsedType,
            keywordPattern,
            pageable
        );

        List<NotificationResponse> items = notificationPage.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PagedResponse.<NotificationResponse>builder()
            .items(items)
            .totalElements(notificationPage.getTotalElements())
            .totalPages(notificationPage.getTotalPages())
            .page(notificationPage.getNumber())
            .size(notificationPage.getSize())
            .hasNext(notificationPage.hasNext())
            .hasPrevious(notificationPage.hasPrevious())
            .build();
    }

    @Override
    public List<NotificationResponse> getMyNotifications(String channel, boolean unreadOnly) {
        Account currentAccount = jwtUtil.getCurrentUserLogin();
        createTaskDateNotifications(currentAccount);
        processDueScheduledNotifications();

        NotificationChannel parsedChannel = parseChannel(channel);

        return notificationRepository.findMyNotifications(currentAccount.getId(), parsedChannel, unreadOnly)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void markAsRead(Long notificationId) {
        Account currentAccount = jwtUtil.getCurrentUserLogin();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppError(ErrorCode.NOTIFICATION_NOT_FOUND));

        boolean canUpdate = notification.getRecipientAccount() != null
                && notification.getRecipientAccount().getId() != null
                && notification.getRecipientAccount().getId().equals(currentAccount.getId());

        if (!canUpdate && !hasAdminRole(currentAccount)) {
            throw new AppError(ErrorCode.NOTIFICATION_AUTHORIZED);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void retryNotification(Long notificationId) {
        assertAdmin();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppError(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (notification.getChannel() != NotificationChannel.EMAIL) {
            throw new AppError(ErrorCode.NOTIFICATION_INVALID_CHANNEL);
        }

        try {
            notification.setStatus(NotificationStatus.PENDING);
            notification.setRetryCount(notification.getRetryCount() + 1);
            notificationRepository.save(notification);

            mailService.sendSimpleMessage(
                    notification.getRecipientAccount().getEmail(),
                    "Task assignment reminder",
                    notification.getRecipientAccount().getUsername(),
                    notification.getMessage()
            );

            notification.setStatus(NotificationStatus.SENT);
            notification.setDeliveredAt(LocalDateTime.now());
            notificationRepository.save(notification);
        } catch (Exception exception) {
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientAccount() != null ? notification.getRecipientAccount().getId() : null)
                .recipientName(notification.getRecipientAccount() != null ? notification.getRecipientAccount().getUsername() : null)
                .recipientEmail(notification.getRecipientAccount() != null ? notification.getRecipientAccount().getEmail() : null)
                .taskId(notification.getTask() != null ? notification.getTask().getId() : null)
                .channel(notification.getChannel())
                .type(notification.getType())
                .status(notification.getStatus())
                .isRead(notification.isRead())
                .retryCount(notification.getRetryCount())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .createdAt(notification.getCreatedAt())
                .scheduledAt(notification.getScheduledAt())
                .deliveredAt(notification.getDeliveredAt())
                .build();
    }

    private void processDueScheduledNotifications() {
        LocalDateTime now = LocalDateTime.now();
        List<Notification> dueNotifications = notificationRepository
                .findByStatusAndScheduledAtLessThanEqual(NotificationStatus.PENDING, now);

        dueNotifications.forEach(this::dispatchNotification);
    }

    private void dispatchNotification(Notification notification) {
        if (notification.getChannel() == NotificationChannel.WEB) {
            notification.setStatus(NotificationStatus.SENT);
            notification.setDeliveredAt(LocalDateTime.now());
            notificationRepository.save(notification);
            return;
        }

        try {
            mailService.sendSimpleMessage(
                    notification.getRecipientAccount().getEmail(),
                    notification.getTitle(),
                    notification.getRecipientAccount().getUsername(),
                    notification.getMessage()
            );

            notification.setStatus(NotificationStatus.SENT);
            notification.setDeliveredAt(LocalDateTime.now());
            notificationRepository.save(notification);
        } catch (Exception exception) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setRetryCount(notification.getRetryCount() + 1);
            notificationRepository.save(notification);
        }
    }

    private void createTaskDateNotifications(Account account) {
        LocalDateTime now = LocalDateTime.now();
        List<Task> myTasks = taskRepository.findByAssignedAccountIdAndIsActiveTrue(account.getId());

        for (Task task : myTasks) {
            if (task.getReminderDate() != null && !task.getReminderDate().isAfter(now)) {
                boolean reminderExists = notificationRepository.existsByRecipientAccountIdAndTaskIdAndTypeAndChannel(
                        account.getId(),
                        task.getId(),
                        NotificationType.TASK_REMINDER,
                        NotificationChannel.WEB
                );

                if (!reminderExists) {
                    Notification reminderNotification = Notification.builder()
                            .recipientAccount(account)
                            .task(task)
                            .channel(NotificationChannel.WEB)
                            .type(NotificationType.TASK_REMINDER)
                            .status(NotificationStatus.SENT)
                            .title("Task reminder")
                            .message("Task '" + task.getTitle() + "' has reached its reminder time.")
                            .scheduledAt(task.getReminderDate())
                            .deliveredAt(now)
                            .build();

                    notificationRepository.save(reminderNotification);
                }
            }

            if (task.getDueDate() != null && !task.getDueDate().isAfter(now)) {
                boolean dueExists = notificationRepository.existsByRecipientAccountIdAndTaskIdAndTypeAndChannel(
                        account.getId(),
                        task.getId(),
                        NotificationType.TASK_DUE,
                        NotificationChannel.WEB
                );

                if (!dueExists) {
                    Notification dueNotification = Notification.builder()
                            .recipientAccount(account)
                            .task(task)
                            .channel(NotificationChannel.WEB)
                            .type(NotificationType.TASK_DUE)
                            .status(NotificationStatus.SENT)
                            .title("Task due")
                            .message("Task '" + task.getTitle() + "' is now due.")
                            .scheduledAt(task.getDueDate())
                            .deliveredAt(now)
                            .build();

                    notificationRepository.save(dueNotification);
                }
            }
        }
    }

    private NotificationChannel parseChannel(String channel) {
        if (channel == null || channel.trim().isEmpty() || "all".equalsIgnoreCase(channel)) {
            return null;
        }

        String normalized = channel.trim().toUpperCase(Locale.ROOT);
        try {
            return NotificationChannel.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private NotificationStatus parseStatus(String status) {
        if (status == null || status.trim().isEmpty() || "all".equalsIgnoreCase(status)) {
            return null;
        }

        String normalized = status.trim().toUpperCase(Locale.ROOT);
        try {
            return NotificationStatus.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private NotificationType parseType(String type) {
        if (type == null || type.trim().isEmpty() || "all".equalsIgnoreCase(type)) {
            return null;
        }

        String normalized = type.trim().toUpperCase(Locale.ROOT);
        try {
            return NotificationType.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private void assertAdmin() {
        Account currentAccount = jwtUtil.getCurrentUserLogin();
        if (!hasAdminRole(currentAccount)) {
            throw new AppError(ErrorCode.NOTIFICATION_AUTHORIZED);
        }
    }

    private boolean hasAdminRole(Account account) {
        if (account == null || account.getRoles() == null) {
            return false;
        }

        return account.getRoles().stream()
                .map(role -> role.getName())
                .anyMatch(roleName -> roleName == RoleName.SUPER_ADMIN || roleName == RoleName.ADMIN);
    }
}
