package com.example.trello.service.comment;

import com.example.trello.dto.request.CommentRequest;
import com.example.trello.dto.response.CommentResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public interface CommentService {
    List<CommentResponse> getCommentsByTaskId(Long taskId);

    @Transactional
    CommentResponse createComment(CommentRequest request);
}