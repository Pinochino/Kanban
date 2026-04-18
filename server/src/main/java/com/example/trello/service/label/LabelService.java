package com.example.trello.service.label;

import com.example.trello.dto.request.LabelRequest;
import com.example.trello.dto.response.LabelResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public interface LabelService {
    List<LabelResponse> getLabels(Long projectId);

    LabelResponse getLabel(Long labelId);

    @Transactional
    LabelResponse createLabel(LabelRequest request);

    @Transactional
    void deleteLabel(Long projectId, Long labelId);

    @Transactional
    LabelResponse updateLabel(Long labelId,
                              LabelRequest request);
}
