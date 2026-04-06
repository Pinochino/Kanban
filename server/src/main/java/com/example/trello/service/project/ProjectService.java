package com.example.trello.service.project;

import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.model.Account;
import jakarta.transaction.Transactional;

import java.util.List;

public interface ProjectService {
    List<ProjectResponse> getProjects();

    ProjectResponse getProject(Long id);

    @Transactional
    ProjectResponse createProject(ProjectRequest projectRequest);

    @Transactional
    void deleteProject(Long id);

    @Transactional
    void deleteAllProjects();
}
