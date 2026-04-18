package com.example.trello.controller;

import com.example.trello.dto.request.AdminCreateNotificationRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.NotificationResponse;
import com.example.trello.dto.response.PagedResponse;
import com.example.trello.service.notification.NotificationService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@CrossOrigin
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    @PostMapping("/admin/create")
    public ResponseEntity<AppResponse<Void>> createAdminNotification(@Valid @RequestBody AdminCreateNotificationRequest request) {
        notificationService.createAdminNotification(request);
        return ResponseEntity.ok(new AppResponse<>(200, "Create notification success"));
    }

    @GetMapping("/admin/list")
    public ResponseEntity<AppResponse<PagedResponse<NotificationResponse>>> getAdminNotifications(
            @RequestParam(value = "channel", required = false) String channel,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "recipientId", required = false) Long recipientId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "10", required = false) int size
    ) {
        PagedResponse<NotificationResponse> notifications = notificationService
                .getAdminNotifications(channel, status, type, recipientId, keyword, page, size);
        return ResponseEntity.ok(new AppResponse<>(200, "Get notifications success", notifications));
    }

    @GetMapping("/my/list")
    public ResponseEntity<AppResponse<List<NotificationResponse>>> getMyNotifications(
            @RequestParam(value = "channel", required = false, defaultValue = "WEB") String channel,
            @RequestParam(value = "unreadOnly", required = false, defaultValue = "false") boolean unreadOnly
    ) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(channel, unreadOnly);
        return ResponseEntity.ok(new AppResponse<>(200, "Get my notifications success", notifications));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<AppResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(new AppResponse<>(200, "Mark notification as read success"));
    }

    @PatchMapping("/admin/retry/{notificationId}")
    public ResponseEntity<AppResponse<Void>> retryNotification(@PathVariable Long notificationId) {
        notificationService.retryNotification(notificationId);
        return ResponseEntity.ok(new AppResponse<>(200, "Retry notification success"));
    }
}
