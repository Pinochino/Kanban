package com.example.trello.controller;

import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.TaskLabelResponse;
import com.example.trello.service.tasklabel.TaskLabelService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/task-labels")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskLabelController {

    TaskLabelService taskLabelService;

    @GetMapping("/list/{taskId}")
    public ResponseEntity<AppResponse<List<TaskLabelResponse>>> getTaskLabels(@PathVariable Long taskId) {
        List<TaskLabelResponse> labels = taskLabelService.getTaskLabels(taskId);
        return ResponseEntity.ok(new AppResponse<>(200, "Get task labels success", labels));
    }

    @PostMapping("/toggle")
    public ResponseEntity<AppResponse<List<TaskLabelResponse>>> toggleTaskLabel(
            @RequestParam("taskId") Long taskId,
            @RequestParam("labelId") Long labelId
    ) {
        List<TaskLabelResponse> labels = taskLabelService.toggleTaskLabel(taskId, labelId);
        return ResponseEntity.ok(new AppResponse<>(200, "Toggle task label success", labels));
    }
}