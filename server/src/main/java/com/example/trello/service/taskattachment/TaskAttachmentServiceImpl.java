package com.example.trello.service.taskattachment;

import com.example.trello.constants.ActionType;
import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.TaskAttachmentResponse;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.Task;
import com.example.trello.model.TaskAttachment;
import com.example.trello.repository.TaskAttachmentRepository;
import com.example.trello.repository.TaskRepository;
import com.example.trello.service.cloudinary.CloudinaryService;
import com.example.trello.service.taskactivity.TaskActivityService;
import com.example.trello.utils.JwtUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskAttachmentServiceImpl implements TaskAttachmentService {

    static final long MAX_ATTACHMENT_SIZE_BYTES = 15L * 1024L * 1024L;
    static final Set<String> BLOCKED_EXTENSIONS = Set.of("exe", "bat", "cmd", "sh", "msi", "js");

    TaskRepository taskRepository;
    TaskAttachmentRepository taskAttachmentRepository;
    CloudinaryService cloudinaryService;
    JwtUtil jwtUtil;
    TaskActivityService taskActivityService;

    @Override
    public List<TaskAttachmentResponse> getTaskAttachmentsByTaskId(Long taskId) {
        taskRepository.findById(taskId)
            .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        return taskAttachmentRepository.findAllByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TaskAttachmentResponse uploadAttachment(Long taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_NOT_FOUND));

        validateAttachment(file);

        String fileUrl = cloudinaryService.uploadTaskAttachment(file, taskId);

        TaskAttachment attachment = TaskAttachment.builder()
                .task(task)
                .fileName(resolveFileName(file))
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .mimeType(resolveMimeType(file))
                .build();

        attachment = taskAttachmentRepository.save(attachment);

        Account actor = jwtUtil.getCurrentUserLogin();
        taskActivityService.log(task, actor, ActionType.ATTACHMENT_UPLOAD,
                "Uploaded attachment '" + attachment.getFileName() + "'.");

        return toResponse(attachment);
    }

    @Override
    public void deleteAttachment(Long attachmentId) {
        TaskAttachment attachment = taskAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new AppError(ErrorCode.TASK_ATTACHMENT_NOT_FOUND));

        Task task = attachment.getTask();
        String fileName = attachment.getFileName();

        cloudinaryService.deleteByUrl(attachment.getFileUrl());
        taskAttachmentRepository.delete(attachment);

        Account actor = jwtUtil.getCurrentUserLogin();
        taskActivityService.log(task, actor, ActionType.ATTACHMENT_DELETE,
                "Deleted attachment '" + fileName + "'.");
    }

    @Override
    public void deleteByTaskId(Long taskId) {
        taskAttachmentRepository.findAllByTaskIdOrderByCreatedAtDesc(taskId)
                .forEach(attachment -> cloudinaryService.deleteByUrl(attachment.getFileUrl()));

        taskAttachmentRepository.deleteByTaskId(taskId);
    }

    @Override
    public void deleteAll() {
        taskAttachmentRepository.findAll()
                .forEach(attachment -> cloudinaryService.deleteByUrl(attachment.getFileUrl()));

        taskAttachmentRepository.deleteAll();
    }

    private TaskAttachmentResponse toResponse(TaskAttachment attachment) {
        return TaskAttachmentResponse.builder()
                .id(attachment.getId())
                .taskId(attachment.getTask() != null ? attachment.getTask().getId() : null)
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .fileSize(attachment.getFileSize())
                .mimeType(attachment.getMimeType())
                .createdAt(attachment.getCreatedAt())
                .updatedAt(attachment.getUpdatedAt())
                .build();
    }

    private String resolveFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            return "attachment";
        }

        String sanitized = originalFilename
                .replace("\\", "_")
                .replace("/", "_")
                .trim();

        if (sanitized.length() > 180) {
            sanitized = sanitized.substring(sanitized.length() - 180);
        }

        return sanitized;
    }

    private String resolveMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        return (contentType == null || contentType.isBlank())
                ? "application/octet-stream"
                : contentType;
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppError(ErrorCode.TASK_ATTACHMENT_FILE_REQUIRED);
        }

        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new AppError(ErrorCode.TASK_ATTACHMENT_FILE_TOO_LARGE);
        }

        String fileName = resolveFileName(file).toLowerCase();
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > -1 && dotIndex < fileName.length() - 1) {
            String extension = fileName.substring(dotIndex + 1);
            if (BLOCKED_EXTENSIONS.contains(extension)) {
                throw new AppError(ErrorCode.TASK_ATTACHMENT_INVALID_FILE_TYPE);
            }
        }
    }
}
