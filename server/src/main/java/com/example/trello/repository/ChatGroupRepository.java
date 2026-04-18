package com.example.trello.repository;

import com.example.trello.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    @Query("""
            select distinct g from ChatGroup g
            join fetch g.members m
            where m.id = :memberId
            order by g.createdAt desc, g.id desc
            """)
    List<ChatGroup> findGroupsForMember(@Param("memberId") Long memberId);

    @Query("""
            select distinct g from ChatGroup g
            join fetch g.members m
            where g.id = :groupId
              and m.id = :memberId
            """)
    Optional<ChatGroup> findByIdAndMemberId(@Param("groupId") Long groupId,
                                            @Param("memberId") Long memberId);
}