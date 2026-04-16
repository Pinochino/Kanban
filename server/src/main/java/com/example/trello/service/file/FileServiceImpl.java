package com.example.trello.service.file;

import com.example.trello.config.StorageProperties;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Stream;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileServiceImpl implements FileService {

    Path rootLocation;

    @Autowired
    public FileServiceImpl(StorageProperties properties) {

        if (properties.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Location cannot be empty");
        }

        this.rootLocation = Paths.get(properties.getLocation());
    }

    @Override
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create the root location", e);
        }
    }

    @Override
    public void store(MultipartFile file) {
        try {

            if (file.isEmpty()) {
                throw new IllegalArgumentException("File cannot be empty");
            }

            Path destinationFile = rootLocation.resolve(
                    Paths.get(file.getOriginalFilename())
                            .normalize().toAbsolutePath()
            );

            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new IllegalArgumentException("The root location is not a directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public Stream<Path> loadAll() {
        return Stream.empty();
    }

    @Override
    public Path load(String filename) {
        return rootLocation.resolve(filename);
    }

    @Override
    public Resource loadAsResource(String filename) {
        return null;
    }

    @Override
    public void deleteAll() {
        FileSystemUtils.deleteRecursively(rootLocation.toFile());
    }
}
