package com.example.trello.repository;

import com.example.trello.model.ChatGroupMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatGroupMessageRepository extends JpaRepository<ChatGroupMessage, Long> {

    @Query("""
            select m from ChatGroupMessage m
            where m.chatGroup.id = :groupId
            order by m.createdAt desc, m.id desc
            """)
    Page<ChatGroupMessage> findConversation(@Param("groupId") Long groupId, Pageable pageable);

    @Query("""
            select m from ChatGroupMessage m
            where m.chatGroup.id = :groupId
            order by m.createdAt desc, m.id desc
            """)
    List<ChatGroupMessage> findLatestConversationMessages(@Param("groupId") Long groupId,
                                                           Pageable pageable);
}