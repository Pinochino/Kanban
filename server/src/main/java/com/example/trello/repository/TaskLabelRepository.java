package com.example.trello.repository;

import com.example.trello.model.TaskLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, Long> {
	List<TaskLabel> findAllByTaskId(Long taskId);

	Optional<TaskLabel> findByTaskIdAndLabelId(Long taskId, Long labelId);
}