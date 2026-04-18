package com.example.trello.service.label;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.request.LabelRequest;
import com.example.trello.dto.response.LabelResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.LabelMapper;
import com.example.trello.model.Label;
import com.example.trello.model.Project;
import com.example.trello.repository.LabelRepository;
import com.example.trello.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class LabelServiceImpl implements LabelService {

    LabelRepository labelRepository;
    ProjectRepository projectRepository;
    LabelMapper labelMapper;

    @Override
    public List<LabelResponse> getLabels(Long projectId) {
        Project project = projectRepository
                .findById(projectId)
                .orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));

        List<Label> labels = project.getListLabels();

        return labels.stream().map(labelMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public LabelResponse getLabel(Long labelId) {
        Label label = labelRepository
                .findById(labelId)
                .orElseThrow(() -> new AppError(ErrorCode.LABEL_NOT_FOUND));

        return labelMapper.toResponse(label);
    }

    @Transactional
    @Override
    public LabelResponse createLabel(LabelRequest request) {

        Project project = projectRepository
                .findById(request.getProjectId())
                .orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));

        Optional<Label> label = labelRepository
                .findLabelByTitle(request.getTitle());

        if (label.isPresent()) {
            throw new AppError(ErrorCode.LABEL_ALREADY_EXIST);
        }

        Label newLabel = labelMapper.toDto(request);
        newLabel.setProject(project);

        newLabel = labelRepository.save(newLabel);

        return labelMapper.toResponse(newLabel);
    }

    @Transactional
    @Override
    public void deleteLabel(Long projectId, Long labelId) {
        Project project = projectRepository
                .findById(projectId)
                .orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));

        Label label = labelRepository
                .findById(labelId)
                .orElseThrow(() -> new AppError(ErrorCode.LABEL_NOT_FOUND));

        if (!label.getProject().getId().equals(project.getId())) {
            throw new AppError(ErrorCode.LABEL_NOT_FOUND);
        }

        project.getListLabels().remove(label);
    }


    @Transactional
    @Override
    public LabelResponse updateLabel(Long labelId,
                                     LabelRequest request) {

        Project oldProject = projectRepository
                .findById(request.getProjectId())
                .orElseThrow(() -> new AppError(ErrorCode.PROJECT_NOT_FOUND));

        Label label = labelRepository
                .findLabelByIdAndProject(labelId, oldProject)
                .orElseThrow(() -> new AppError(ErrorCode.LABEL_NOT_FOUND));

        labelMapper.updateLabel(label, request);

        label = labelRepository.save(label);

        return labelMapper.toResponse(label);
    }


}
