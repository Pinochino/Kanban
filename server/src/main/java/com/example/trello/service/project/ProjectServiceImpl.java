package com.example.trello.service.project;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.ListTaskStatus;
import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.AccountCreateProjectResponse;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.ProjectMapper;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Project;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.ListTaskRepository;
import com.example.trello.repository.ProjectRepository;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.utils.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
public class ProjectServiceImpl implements ProjectService {

    private static final Map<ListTaskStatus, Integer> LIST_TASK_ORDER = Map.of(
            ListTaskStatus.TO_DO, 0,
            ListTaskStatus.IN_PROGRESS, 1,
            ListTaskStatus.REVIEW, 2,
            ListTaskStatus.DONE, 3
    );

    ProjectRepository projectRepository;
    AccountRepository accountRepository;
    ListTaskRepository listTaskRepository;
    ProjectMapper projectMapper;
    JwtUtil jwtUtil;

    @Transactional
    @Override
    public List<ProjectResponse> getProjects() {
        return projectRepository.findAll().stream().map(project -> {
            ProjectResponse response = projectMapper.toResponse(project);

            Account account = accountRepository
                    .findAccountByEmail(project.getCreatedBy())
                    .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

            AccountCreateProjectResponse accountCreated = AccountCreateProjectResponse.builder()
                    .id(account.getId())
                    .username(account.getUsername())
                    .build();

            response.setCreatedBy(accountCreated);
            normalizeProjectResponse(response);
            return response;
        }).toList();
    }

    @Transactional
    @Override
    public ProjectResponse getProject(Long id) {
        Project project = projectRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));
        ProjectResponse response = projectMapper.toResponse(project);
        normalizeProjectResponse(response);
        return response;
    }

    @Transactional
    @Override
    public ProjectResponse createProject(ProjectRequest projectRequest) {
        Project project = projectRepository.findProjectByTitle(projectRequest.getTitle());

        if (project != null) {
            throw new AppError(ErrorCode.PROJECT_ALREADY_EXIST);
        }

        Project newProject = projectMapper.toProject(projectRequest);

        // Account account = accountRepository
        //         .findById(projectRequest.getAssignAccountId())
        //         .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        // newProject.setAssignedAccount(account);

        newProject = projectRepository.save(newProject);

        List<ListTask> oldListTask = listTaskRepository.findAllByProjectId(newProject.getId());
        List<ListTask> listTasks = List.of(
            createListTask(ListTaskStatus.TO_DO, newProject, 0L),
            createListTask(ListTaskStatus.IN_PROGRESS, newProject, 1L),
            createListTask(ListTaskStatus.REVIEW, newProject, 2L),
            createListTask(ListTaskStatus.DONE, newProject, 3L));

        if (oldListTask.isEmpty()) {
            List<ListTask> savedListTasks = listTaskRepository.saveAll(listTasks);
            newProject.getListTasks().addAll(savedListTasks);
        }

        Account account = accountRepository
                .findAccountByEmail(newProject.getCreatedBy())
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        AccountCreateProjectResponse accountCreated = AccountCreateProjectResponse.builder()
                .id(account.getId())
                .username(account.getUsername())
                .build();

        ProjectResponse projectResponse = projectMapper.toResponse(newProject);
        projectResponse.setCreatedBy(accountCreated);
        normalizeProjectResponse(projectResponse);

        return projectResponse;
    }

    private ListTask createListTask(ListTaskStatus status, Project project, Long orderIndex) {
        ListTask listTask = new ListTask(status, project);
        listTask.setOrderIndex(orderIndex);
        return listTask;
    }

    private void normalizeProjectResponse(ProjectResponse response) {
        if (response.getListTasks() == null || response.getListTasks().isEmpty()) {
            return;
        }

        response.getListTasks().sort(Comparator.comparingInt(listTaskResponse ->
                LIST_TASK_ORDER.getOrDefault(listTaskResponse.getStatus(), Integer.MAX_VALUE)));

        response.getListTasks().forEach(listTask -> {
            if (listTask.getTaskList() == null) {
                return;
            }

            listTask.getTaskList().sort(Comparator
                    .comparing(TaskResponse::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(task -> task.getOrderIndex() == null ? Long.MAX_VALUE : task.getOrderIndex())
                    .thenComparing(task -> task.getId() == null ? Long.MAX_VALUE : task.getId()));
        });
    }


    @Transactional
    @Override
    public void deleteProject(Long projectId) {
        Account account = jwtUtil.getCurrentUserLogin();
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));

        projectRepository.delete(project);
        // account.getProjects().remove(project);
    }

    @Transactional
    @Override
    public void deleteAllProjects() {
        Account account = jwtUtil.getCurrentUserLogin();
        projectRepository.deleteAll();
        // account.getProjects().clear();
//        }
    }

}
