//package com.example.trello.config;
//
//import io.github.cdimascio.dotenv.Dotenv;
//import org.springframework.context.ApplicationContextInitializer;
//import org.springframework.context.ConfigurableApplicationContext;
//
//public class DotenvApplicationInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
//    @Override
//    public void initialize(ConfigurableApplicationContext context) {
//        Dotenv dotenv = Dotenv.load();
//        dotenv.entries().forEach(entry ->
//                System.setProperty(entry.getKey(), entry.getValue())
//        );
//    }
//}
