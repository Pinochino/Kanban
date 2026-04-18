package com.example.trello.controller;

import com.example.trello.constants.ListTaskStatus;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.DashboardStatsResponse;
import com.example.trello.dto.response.StatusCountResponse;
import com.example.trello.repository.ProjectRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.service.account.AccountService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardController {

    AccountService accountService;
    ProjectRepository projectRepository;
    TaskRepository taskRepository;

    @GetMapping("/stats")
    public ResponseEntity<AppResponse<DashboardStatsResponse>> getDashboardStats() {
        long totalUsers = accountService.countAccounts();
        long totalProjects = projectRepository.count();
        long totalTasks = taskRepository.countAllTasks();
        long doneTasks = taskRepository.countTasksByStatus(ListTaskStatus.DONE);

        DashboardStatsResponse dashboardStats = DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalProjects(totalProjects)
                .totalTasks(totalTasks)
                .unfinishedTasks(Math.max(totalTasks - doneTasks, 0))
                .statusDistribution(List.of(
                        StatusCountResponse.builder().name("To do").value(taskRepository.countTasksByStatus(ListTaskStatus.TO_DO)).build(),
                        StatusCountResponse.builder().name("In progress").value(taskRepository.countTasksByStatus(ListTaskStatus.IN_PROGRESS)).build(),
                        StatusCountResponse.builder().name("Review").value(taskRepository.countTasksByStatus(ListTaskStatus.REVIEW)).build(),
                        StatusCountResponse.builder().name("Done").value(doneTasks).build()
                ))
                .build();

        return ResponseEntity.ok().body(new AppResponse<>(200, "Get dashboard stats success", dashboardStats));
    }
}