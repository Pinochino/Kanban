package com.example.trello.service.project;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.ListTaskStatus;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.ProjectMapper;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Project;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ListTaskRepository;
import com.example.trello.repository.ProjectRepository;
import com.example.trello.security.CustomUserDetail;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    ProjectRepository projectRepository;
    AccountRepository accountRepository;
    ListTaskRepository listTaskRepository;
    ProjectMapper projectMapper;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository,
                              AccountRepository accountRepository,
                              ListTaskRepository listTaskRepository,
                              ProjectMapper projectMapper) {
        this.projectRepository = projectRepository;
        this.accountRepository = accountRepository;
        this.listTaskRepository = listTaskRepository;
        this.projectMapper = projectMapper;
    }

    @Override
    public List<ProjectResponse> getProjects() {
        return projectRepository.findAll().stream().map(project -> projectMapper.toResponse(project)).toList();
    }

    @Override
    public ProjectResponse getProject(Long id) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));
        return projectMapper.toResponse(project);
    }

    @Transactional
    @Override
    public ProjectResponse createProject(ProjectRequest projectRequest) {
        Project project = projectRepository.findProjectByTitle(projectRequest.getTitle());

        if (project != null) {
            throw new AppError(ErrorCode.PROJECT_ALREADY_EXIST);
        }

        Project newProject = projectMapper.toProject(projectRequest);

        Account account = checkAdminRole();


        newProject.setAccount(account);

        newProject = projectRepository.save(newProject);

        Optional<ListTask> oldListTask = listTaskRepository.findByProjectId(newProject.getProjectId());
        List<ListTask> listTasks = List.of(
                new ListTask(ListTaskStatus.IN_PROGRESS, newProject),
                new ListTask(ListTaskStatus.TO_DO, newProject),
                new ListTask(ListTaskStatus.DONE, newProject),
                new ListTask(ListTaskStatus.REVIEW, newProject),
                new ListTask(ListTaskStatus.BLOCKED, newProject));

        if (oldListTask.isEmpty()) {
            listTaskRepository.saveAll(listTasks);
        }

        return projectMapper.toResponse(newProject);
    }

    private Account checkAdminRole() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = jwt.getClaim("sub");

        Account account = accountRepository.findAccountByEmail(email).orElseThrow(() ->
                new AppError(ErrorCode.USER_NOT_FOUND));

        boolean checkRoleAdmin = account.getRoles().stream().anyMatch(role ->
                role.getName().equals(RoleName.SUPER_ADMIN));

        if (!checkRoleAdmin) {
            throw new AppError(ErrorCode.PROJECT_AUTHORIZED);
        }

        return account;
    }

    @Transactional
    @Override
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));
        Account account = checkAdminRole();

        if (account != null) {
            projectRepository.delete(project);
            account.getProjects().remove(project);
        }
    }

    @Transactional
    @Override
    public void deleteAllProjects() {
        Account account = checkAdminRole();
        if (account != null) {
            projectRepository.deleteAll();
            account.getProjects().clear();
        }
    }

}
