package com.example.trello.repository;

import com.example.trello.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
	List<Comment> findAllByTaskIdOrderByCreatedAtDesc(Long taskId);

	void deleteByAccountId(Long accountId);
}
