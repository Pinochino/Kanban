package com.example.trello.controller;

import com.example.trello.dto.request.LabelRequest;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.LabelResponse;
import com.example.trello.service.label.LabelService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/labels")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class LabelController {

    LabelService labelService;

    @GetMapping("/list/{projectId}")
    public ResponseEntity<AppResponse<List<LabelResponse>>> getLabels(@PathVariable Long projectId) {
        List<LabelResponse> labels = labelService.getLabels(projectId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get labels success", labels));
    }

    @GetMapping("/detail/{labelId}")
    public ResponseEntity<AppResponse<LabelResponse>> getLabel(@PathVariable Long labelId) {
        LabelResponse label = labelService.getLabel(labelId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get label success", label));
    }

    @PostMapping("/create")
    public ResponseEntity<AppResponse<LabelResponse>> createLabel(@Valid @RequestBody LabelRequest labelRequest) {
        LabelResponse label = labelService.createLabel(labelRequest);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Create label success", label));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<AppResponse<Void>> deleteLabel(@RequestParam(required = true, name = "labelId") Long labelId,
                                                         @RequestParam(required = false, name = "projectId") Long projectId) {
        labelService.deleteLabel(labelId, projectId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete label success"));
    }

    @PutMapping("/update/{labelId}")
    public ResponseEntity<AppResponse<LabelResponse>> updateLabel(@PathVariable("labelId") Long labelId,
                                                                  @Valid @RequestBody LabelRequest labelRequest) {
        LabelResponse label = labelService.updateLabel(labelId, labelRequest);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Update label success", label));
    }
}
