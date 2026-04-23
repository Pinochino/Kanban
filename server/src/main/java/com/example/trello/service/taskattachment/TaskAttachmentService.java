package com.example.trello.service.taskattachment;

import com.example.trello.dto.response.TaskAttachmentResponse;
import jakarta.transaction.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TaskAttachmentService {

    List<TaskAttachmentResponse> getTaskAttachmentsByTaskId(Long taskId);

    @Transactional
    TaskAttachmentResponse uploadAttachment(Long taskId, MultipartFile file);

    TaskAttachmentDownloadData getAttachmentForDownload(Long attachmentId);

    @Transactional
    void deleteAttachment(Long attachmentId);

    @Transactional
    void deleteByTaskId(Long taskId);

    @Transactional
    void deleteAll();
}
