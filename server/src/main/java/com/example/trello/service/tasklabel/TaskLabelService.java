package com.example.trello.service.tasklabel;

import com.example.trello.dto.response.TaskLabelResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public interface TaskLabelService {
    List<TaskLabelResponse> getTaskLabels(Long taskId);

    @Transactional
    List<TaskLabelResponse> toggleTaskLabel(Long taskId, Long labelId);
}