package com.example.trello.service.cloudinary;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

	String uploadAvatar(MultipartFile file, Long accountId);

	String uploadTaskAttachment(MultipartFile file, Long taskId);

	void deleteByUrl(String fileUrl);
}
