package com.example.trello.repository;

import com.example.trello.constants.NotificationChannel;
import com.example.trello.constants.NotificationStatus;
import com.example.trello.constants.NotificationType;
import com.example.trello.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query(value = """
            select n from Notification n
            join n.recipientAccount r
            where (:recipientId is null or r.id = :recipientId)
              and (:channel is null or n.channel = :channel)
              and (:status is null or n.status = :status)
              and (:type is null or n.type = :type)
              and (
                  :keywordPattern is null
                  or lower(coalesce(n.title, '')) like :keywordPattern
                  or lower(coalesce(r.username, '')) like :keywordPattern
                  or lower(coalesce(r.email, '')) like :keywordPattern
              )
            """,
            countQuery = """
            select count(n) from Notification n
            join n.recipientAccount r
            where (:recipientId is null or r.id = :recipientId)
              and (:channel is null or n.channel = :channel)
              and (:status is null or n.status = :status)
              and (:type is null or n.type = :type)
              and (
                  :keywordPattern is null
                  or lower(coalesce(n.title, '')) like :keywordPattern
                  or lower(coalesce(r.username, '')) like :keywordPattern
                  or lower(coalesce(r.email, '')) like :keywordPattern
              )
            """)
    Page<Notification> searchAdminNotifications(@Param("recipientId") Long recipientId,
                                                @Param("channel") NotificationChannel channel,
                                                @Param("status") NotificationStatus status,
                                                @Param("type") NotificationType type,
                          @Param("keywordPattern") String keywordPattern,
                                                Pageable pageable);

    @Query("""
            select n from Notification n
            where n.recipientAccount.id = :recipientId
              and (:channel is null or n.channel = :channel)
              and (:unreadOnly = false or n.isRead = false)
            order by n.createdAt desc
            """)
    List<Notification> findMyNotifications(@Param("recipientId") Long recipientId,
                                           @Param("channel") NotificationChannel channel,
                                           @Param("unreadOnly") boolean unreadOnly);

    List<Notification> findByStatusAndScheduledAtLessThanEqual(NotificationStatus status, LocalDateTime scheduledAt);

    List<Notification> findByTaskId(Long taskId);

    List<Notification> findByTaskIdIn(List<Long> taskIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.task = null where n.task.id = :taskId")
    int clearTaskReferenceByTaskId(@Param("taskId") Long taskId);

    boolean existsByRecipientAccountIdAndTaskIdAndTypeAndChannel(Long recipientAccountId,
                                   Long taskId,
                                   NotificationType type,
                                   NotificationChannel channel);
}
