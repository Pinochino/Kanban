package com.example.trello.repository;

import com.example.trello.model.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {

	List<TaskAttachment> findAllByTaskIdOrderByCreatedAtDesc(Long taskId);

	@Modifying(clearAutomatically = true, flushAutomatically = true)
	@Query("delete from TaskAttachment ta where ta.task.id = :taskId")
	void deleteByTaskId(Long taskId);
}
