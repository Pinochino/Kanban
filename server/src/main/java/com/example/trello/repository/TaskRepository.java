package com.example.trello.repository;

import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Project;
import com.example.trello.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Optional<Task> findByTitle(String title);

    List<Task> findTaskByAssignedAccountAndListTask(Account account, ListTask listTask);
}
