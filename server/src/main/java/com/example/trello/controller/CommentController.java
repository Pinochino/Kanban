package com.example.trello.controller;

import com.example.trello.dto.request.CommentRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.CommentResponse;
import com.example.trello.service.comment.CommentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comments")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentController {

    CommentService commentService;

    @GetMapping("/list/{taskId}")
    public ResponseEntity<AppResponse<List<CommentResponse>>> getComments(@PathVariable Long taskId) {
        List<CommentResponse> comments = commentService.getCommentsByTaskId(taskId);
        return ResponseEntity.ok(new AppResponse<>(200, "Get comments success", comments));
    }

    @PostMapping("/create")
    public ResponseEntity<AppResponse<CommentResponse>> createComment(@RequestBody CommentRequest commentRequest) {
        CommentResponse comment = commentService.createComment(commentRequest);
        return ResponseEntity.ok(new AppResponse<>(200, "Create comment success", comment));
    }
}