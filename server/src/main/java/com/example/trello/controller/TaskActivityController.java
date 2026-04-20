package com.example.trello.controller;

import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.TaskActivityResponse;
import com.example.trello.service.taskactivity.TaskActivityService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/task-activities")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskActivityController {

    TaskActivityService taskActivityService;

    @GetMapping("/list/{taskId}")
    public ResponseEntity<AppResponse<List<TaskActivityResponse>>> getTaskActivities(@PathVariable Long taskId) {
        List<TaskActivityResponse> activities = taskActivityService.getTaskActivitiesByTaskId(taskId);
        return ResponseEntity.ok(new AppResponse<>(200, "Get task activities success", activities));
    }
}