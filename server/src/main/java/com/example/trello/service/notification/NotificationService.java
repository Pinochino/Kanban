package com.example.trello.service.notification;

import com.example.trello.dto.response.NotificationResponse;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.dto.request.AdminCreateNotificationRequest;
import com.example.trello.model.Account;
import com.example.trello.model.Task;

import java.util.List;

public interface NotificationService {

    void notifyTaskAssigned(Task task, Account assignee, Account assignedBy);

    void createAdminNotification(AdminCreateNotificationRequest request);

    PagedResponse<NotificationResponse> getAdminNotifications(String channel,
                                                              String status,
                                                              String type,
                                                              Long recipientId,
                                                              String keyword,
                                                              int page,
                                                              int size);

    List<NotificationResponse> getMyNotifications(String channel, boolean unreadOnly);

    void markAsRead(Long notificationId);

    void deleteNotification(Long notificationId);
}
