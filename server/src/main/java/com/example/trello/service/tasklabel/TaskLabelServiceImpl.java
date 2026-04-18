package com.example.trello.service.tasklabel;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.TaskLabelResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Label;
import com.example.trello.model.Task;
import com.example.trello.model.TaskLabel;
import com.example.trello.repository.LabelRepository;
import com.example.trello.repository.TaskLabelRepository;
import com.example.trello.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskLabelServiceImpl implements TaskLabelService {

    TaskLabelRepository taskLabelRepository;
    TaskRepository taskRepository;
    LabelRepository labelRepository;

    @Override
    public List<TaskLabelResponse> getTaskLabels(Long taskId) {
        return taskLabelRepository.findAllByTaskId(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<TaskLabelResponse> toggleTaskLabel(Long taskId, Long labelId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new AppError(ErrorCode.LABEL_NOT_FOUND));

        taskLabelRepository.findByTaskIdAndLabelId(taskId, labelId)
                .ifPresentOrElse(
                        taskLabelRepository::delete,
                        () -> taskLabelRepository.save(new TaskLabel(null, task, label))
                );

        return taskLabelRepository.findAllByTaskId(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TaskLabelResponse toResponse(TaskLabel taskLabel) {
        return TaskLabelResponse.builder()
                .id(taskLabel.getId())
                .taskId(taskLabel.getTask() != null ? taskLabel.getTask().getId() : null)
                .labelId(taskLabel.getLabel() != null ? taskLabel.getLabel().getId() : null)
                .title(taskLabel.getLabel() != null ? taskLabel.getLabel().getTitle() : null)
                .color(taskLabel.getLabel() != null ? taskLabel.getLabel().getColor() : null)
                .build();
    }
}