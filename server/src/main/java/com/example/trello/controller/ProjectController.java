package com.example.trello.controller;

import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.service.project.ProjectService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/list")
    public ResponseEntity<AppResponse<List<ProjectResponse>>> getProjects() {
        List<ProjectResponse> projects = projectService.getProjects();
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get projects success", projects));
    }

    @GetMapping("/detail/{projectId}")
    public ResponseEntity<AppResponse<ProjectResponse>> getProject(@PathVariable Long projectId) {
        ProjectResponse project = projectService.getProject(projectId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get project success", project));
    }

    @PostMapping("/create")
    public ResponseEntity<AppResponse<ProjectResponse>> createProject(@Valid @RequestBody ProjectRequest projectRequest) {
        ProjectResponse project = projectService.createProject(projectRequest);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Create project success", project));
    }

    @DeleteMapping("/delete/{projectId}")
    public ResponseEntity<AppResponse<ProjectResponse>> deleteProject(@PathVariable Long projectId) {

        projectService.deleteProject(projectId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete project success"));
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<AppResponse<ProjectResponse>> deleteAllProjects() {
        projectService.deleteAllProjects();
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete all projects success"));
    }
}
