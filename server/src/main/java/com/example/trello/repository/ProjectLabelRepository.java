package com.example.trello.repository;

import com.example.trello.model.ProjectLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectLabelRepository extends JpaRepository<ProjectLabel, Long> {
}