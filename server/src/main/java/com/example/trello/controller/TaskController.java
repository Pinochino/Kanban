package com.example.trello.controller;

import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.model.Task;
import com.example.trello.service.task.TaskService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskController {

    TaskService taskService;

    @GetMapping("/list")
    public ResponseEntity<AppResponse<List<TaskResponse>>> getTasks(
            @RequestParam(value = "assignedAccountId", required = true) Long assignedAccountId,
            @RequestParam(value = "listTaskId", required = true) Long listTaskId
    ) {
        List<TaskResponse> tasks = taskService.getTasks(assignedAccountId, listTaskId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get tasks success", tasks));
    }

    @GetMapping("/detail/{taskId}")
    public ResponseEntity<AppResponse<TaskResponse>> getTask(@PathVariable Long taskId) {
        TaskResponse task = taskService.getTask(taskId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get task success", task));
    }

    @PostMapping("/create")
    public ResponseEntity<AppResponse<TaskResponse>> createTask(@Valid @RequestBody TaskRequest taskRequest) {
        TaskResponse task = taskService.createTask(taskRequest);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Create task success", task));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<AppResponse<TaskResponse>> deleteTask(
            @RequestParam("taskId") Long taskId,
            @RequestParam("assignedAccountId") Long assignedAccountId,
            @RequestParam("listTaskId") Long listTaskId
    ) {
        taskService.deleteTask(taskId, assignedAccountId, listTaskId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete task success"));
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<AppResponse<TaskResponse>> deleteAllTasks(
            @RequestParam("assignedAccountId") Long assignedAccountId,
            @RequestParam("listTaskId") Long listTaskId
    ) {
        taskService.deleteTasks(listTaskId, assignedAccountId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete all tasks success"));
    }

    @PutMapping("/update/{taskId}")
    public ResponseEntity<AppResponse<TaskResponse>> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskRequest taskRequest) {
        TaskResponse task = taskService.updateTask(taskId, taskRequest);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Update task success", task));
    }

    @PatchMapping("/update-status/{taskId}")
    public ResponseEntity<AppResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam("listTaskId") Long listTaskId
    ) {
        taskService.updateTaskStatus(taskId, listTaskId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Update task success"));
    }
    

}
