package com.example.trello.service.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryServiceImpl implements CloudinaryService {

	Cloudinary cloudinary;

	@Override
	public String uploadAvatar(MultipartFile file, Long accountId) {
		if (file == null || file.isEmpty()) {
			throw new AppError(ErrorCode.AVATAR_FILE_REQUIRED);
		}

		String contentType = file.getContentType();
		if (contentType == null || !contentType.startsWith("image/")) {
			throw new AppError(ErrorCode.AVATAR_INVALID_FILE_TYPE);
		}

		try {
			Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
					"folder", "trello/avatars",
					"public_id", "account_" + accountId + "_" + System.currentTimeMillis(),
					"resource_type", "image",
					"overwrite", true
			));

			Object secureUrl = uploadResult.get("secure_url");
			if (secureUrl == null) {
				throw new AppError(ErrorCode.AVATAR_UPLOAD_FAILED);
			}

			return String.valueOf(secureUrl);
		} catch (IOException exception) {
			log.error("Upload avatar failed for accountId={}", accountId, exception);
			throw new AppError(ErrorCode.AVATAR_UPLOAD_FAILED);
		}
	}

	@Override
	public void deleteByUrl(String fileUrl) {
		if (fileUrl == null || fileUrl.isBlank()) {
			return;
		}

		String publicId = extractPublicId(fileUrl);
		if (publicId == null || publicId.isBlank()) {
			return;
		}

		try {
			cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
		} catch (IOException exception) {
			log.warn("Delete old avatar failed for publicId={}", publicId, exception);
		}
	}

	private String extractPublicId(String fileUrl) {
		int uploadMarkerIndex = fileUrl.indexOf("/upload/");
		if (uploadMarkerIndex < 0) {
			return null;
		}

		String afterUpload = fileUrl.substring(uploadMarkerIndex + "/upload/".length());
		if (afterUpload.startsWith("v")) {
			int slashIndex = afterUpload.indexOf('/');
			if (slashIndex > -1) {
				afterUpload = afterUpload.substring(slashIndex + 1);
			}
		}

		int dotIndex = afterUpload.lastIndexOf('.');
		return dotIndex > -1 ? afterUpload.substring(0, dotIndex) : afterUpload;
	}

}
