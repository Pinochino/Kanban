package com.example.trello.repository;

import com.example.trello.model.Label;
import com.example.trello.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    Optional<Label> findLabelByTitle(String title);

    Optional<Label> findLabelByIdAndProject(Long labelId, Project project);

}
