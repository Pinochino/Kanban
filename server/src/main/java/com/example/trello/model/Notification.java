package com.example.trello.model;

import com.example.trello.constants.NotificationChannel;
import com.example.trello.constants.NotificationStatus;
import com.example.trello.constants.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Notification extends AbstractEntity implements Serializable {

    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_account_id", nullable = false)
    Account recipientAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    Task task;

    @Enumerated(EnumType.STRING)
    NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    NotificationType type;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    NotificationStatus status = NotificationStatus.PENDING;

    @Builder.Default
    boolean isRead = false;

    @Builder.Default
    int retryCount = 0;

    String title;

    @Column(columnDefinition = "TEXT")
    String message;

    LocalDateTime scheduledAt;

    LocalDateTime deliveredAt;
}
