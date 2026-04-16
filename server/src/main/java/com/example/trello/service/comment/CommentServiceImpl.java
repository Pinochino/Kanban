package com.example.trello.service.comment;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.request.CommentRequest;
import com.example.trello.dto.response.AccountAssignedProjectResponse;
import com.example.trello.dto.response.CommentResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.Comment;
import com.example.trello.model.Task;
import com.example.trello.repository.CommentRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.utils.JwtUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentServiceImpl implements CommentService {

    CommentRepository commentRepository;
    TaskRepository taskRepository;
    JwtUtil jwtUtil;

    @Override
    public List<CommentResponse> getCommentsByTaskId(Long taskId) {
        return commentRepository.findAllByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CommentResponse createComment(CommentRequest request) {
        Task task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        Account account = jwtUtil.getCurrentUserLogin();

        Comment comment = Comment.builder()
                .comment(request.getComment())
                .task(task)
                .account(account)
                .build();

        comment = commentRepository.save(comment);

        return toResponse(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        AccountAssignedProjectResponse author = new AccountAssignedProjectResponse(
                comment.getAccount().getId(),
                comment.getAccount().getUsername()
        );

        return CommentResponse.builder()
                .id(comment.getId())
                .comment(comment.getComment())
                .taskId(comment.getTask() != null ? comment.getTask().getId() : null)
                .account(author)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}