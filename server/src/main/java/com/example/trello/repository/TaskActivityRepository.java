package com.example.trello.repository;

import com.example.trello.model.TaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {

    void deleteByAccountId(Long accountId);
}
