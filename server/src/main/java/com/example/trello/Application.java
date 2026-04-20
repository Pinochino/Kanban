package com.example.trello;

import com.example.trello.config.DotenvApplicationInitializer;
import com.example.trello.config.StorageProperties;
import com.example.trello.service.file.FileService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@EnableConfigurationProperties(StorageProperties.class)
public class Application {

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class)
                .initializers(new DotenvApplicationInitializer())
                .run(args);
    }

    @Bean
    CommandLineRunner init(FileService fileService) {
        return args -> {
            fileService.init();
        };
    }

}
