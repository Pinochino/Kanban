package com.example.trello;

//import com.example.trello.config.DotenvApplicationInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class Application {

    public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
//        new SpringApplicationBuilder(Application.class)
//                .initializers(new DotenvApplicationInitializer())
//                .run(args);
    }

}
