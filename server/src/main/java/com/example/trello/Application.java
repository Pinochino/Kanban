package com.example.trello;

//import com.example.trello.config.DotenvApplicationInitializer;
import com.example.trello.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@EnableConfigurationProperties(StorageProperties.class)
public class Application {

    public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
//        new SpringApplicationBuilder(Application.class)
//                .initializers(new DotenvApplicationInitializer())
//                .run(args);
    }

}
