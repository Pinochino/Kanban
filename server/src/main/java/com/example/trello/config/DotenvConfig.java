package com.example.trello.config;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class DotenvConfig {

    @PostConstruct
    public void init() {
        Dotenv dotenv = loadDotenv();
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });
    }

    private Dotenv loadDotenv() {
        String userDir = System.getProperty("user.dir", "");

        Path moduleDotenvPath = Path.of(userDir, "server", ".env");
        if (Files.exists(moduleDotenvPath)) {
            return Dotenv.configure()
                    .directory(Path.of(userDir, "server").toString())
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
        }

        Path currentDotenvPath = Path.of(userDir, ".env");
        if (Files.exists(currentDotenvPath)) {
            return Dotenv.configure()
                    .directory(userDir)
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
        }

        return Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }
}
