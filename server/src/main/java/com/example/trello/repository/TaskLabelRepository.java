package com.example.trello.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, Long> {
}