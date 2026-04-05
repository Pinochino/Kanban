package com.example.trello.repository;

import com.example.trello.model.ListTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ListTaskRepository extends JpaRepository<ListTask, Long> {

    @Query("select lt from ListTask lt where lt.project.projectId=?1")
    Optional<ListTask> findByProjectId(Long projectId);

}
