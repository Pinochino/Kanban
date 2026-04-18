package com.example.trello.repository;

import com.example.trello.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
            select m from ChatMessage m
            where (
                (m.sender.id = :currentUserId and m.receiver.id = :otherUserId)
                or
                (m.sender.id = :otherUserId and m.receiver.id = :currentUserId)
            )
            order by m.createdAt desc, m.id desc
            """)
    Page<ChatMessage> findConversation(@Param("currentUserId") Long currentUserId,
                                       @Param("otherUserId") Long otherUserId,
                                       Pageable pageable);

    @Query("""
            select count(m) from ChatMessage m
            where m.sender.id = :senderId
              and m.receiver.id = :receiverId
              and m.isRead = false
            """)
    long countUnreadBySenderAndReceiver(@Param("senderId") Long senderId,
                                        @Param("receiverId") Long receiverId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update ChatMessage m
            set m.isRead = true
            where m.sender.id = :senderId
              and m.receiver.id = :receiverId
              and m.isRead = false
            """)
    int markConversationAsRead(@Param("senderId") Long senderId,
                               @Param("receiverId") Long receiverId);

    @Query("""
            select m from ChatMessage m
            where (
                (m.sender.id = :currentUserId and m.receiver.id = :otherUserId)
                or
                (m.sender.id = :otherUserId and m.receiver.id = :currentUserId)
            )
            order by m.createdAt desc, m.id desc
            """)
    List<ChatMessage> findLatestConversationMessages(@Param("currentUserId") Long currentUserId,
                                                     @Param("otherUserId") Long otherUserId,
                                                     Pageable pageable);
}
