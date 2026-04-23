package com.example.trello.controller;

import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.TaskAttachmentResponse;
import com.example.trello.service.taskattachment.TaskAttachmentDownloadData;
import com.example.trello.service.taskattachment.TaskAttachmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/task-attachments")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskAttachmentController {

    TaskAttachmentService taskAttachmentService;

    @GetMapping("/list/{taskId}")
    public ResponseEntity<AppResponse<List<TaskAttachmentResponse>>> getTaskAttachmentsByTaskId(
            @PathVariable Long taskId
    ) {
        List<TaskAttachmentResponse> taskAttachments = taskAttachmentService.getTaskAttachmentsByTaskId(taskId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get task attachments success", taskAttachments));
    }

    @PostMapping(value = "/upload/{taskId}", consumes = {"multipart/form-data"})
    public ResponseEntity<AppResponse<TaskAttachmentResponse>> uploadTaskAttachment(
            @PathVariable Long taskId,
            @RequestPart("file") MultipartFile file
    ) {
        TaskAttachmentResponse taskAttachment = taskAttachmentService.uploadAttachment(taskId, file);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Upload task attachment success", taskAttachment));
    }

    @DeleteMapping("/delete/{attachmentId}")
    public ResponseEntity<AppResponse<Void>> deleteTaskAttachment(
            @PathVariable Long attachmentId
    ) {
        taskAttachmentService.deleteAttachment(attachmentId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete task attachment success"));
    }

    @GetMapping("/download/{attachmentId}")
    public ResponseEntity<Resource> downloadTaskAttachment(@PathVariable Long attachmentId) {
        TaskAttachmentDownloadData data = taskAttachmentService.getAttachmentForDownload(attachmentId);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(data.mimeType());
        } catch (Exception exception) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        String disposition = ContentDisposition.attachment()
                .filename(data.fileName(), StandardCharsets.UTF_8)
                .build()
                .toString();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(data.fileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(data.resource());
    }
}
