package com.example.trello.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.nio.file.Files;
import java.nio.file.Path;

public class DotenvApplicationInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        Dotenv dotenv = loadDotenv();
        dotenv.entries().forEach(entry ->
                System.setProperty(entry.getKey(), entry.getValue())
        );
    }

    private Dotenv loadDotenv() {
        String userDir = System.getProperty("user.dir", "");

        // Support running from workspace root and from the server module root.
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

        // Fall back safely when .env is not present.
        return Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }
}
