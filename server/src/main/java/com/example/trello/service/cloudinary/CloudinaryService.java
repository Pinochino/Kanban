package com.example.trello.service.cloudinary;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

	String uploadAvatar(MultipartFile file, Long accountId);

	void deleteByUrl(String fileUrl);
}
