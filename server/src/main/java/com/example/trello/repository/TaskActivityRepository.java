package com.example.trello.repository;

import com.example.trello.model.TaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {

    List<TaskActivity> findAllByTaskIdOrderByCreatedAtDesc(Long taskId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from TaskActivity ta where ta.account.id = :accountId")
    void deleteByAccountId(Long accountId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from TaskActivity ta where ta.task.id = :taskId")
    void deleteByTaskId(Long taskId);
}
