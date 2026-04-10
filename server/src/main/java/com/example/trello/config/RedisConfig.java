package com.example.trello.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;


@Configuration
@Slf4j
public class RedisConfig {

    @Value("${spring.data.redis.port}")
    private int port;

    @Value("${spring.data.redis.host}")
    private String hostName;

    @Bean
    public LettuceConnectionFactory lettuceConnectionFactory() {

        // LettuceClientConfiguration clientConfig =
        // LettuceClientConfiguration.builder()
        // .useSsl().and()
        // .commandTimeout(Duration.ofSeconds(2))
        // .shutdownTimeout(Duration.ZERO)
        // .build();

        RedisStandaloneConfiguration configuration = new RedisStandaloneConfiguration(hostName, port);

        return new LettuceConnectionFactory(configuration);
    }

    @Bean
    RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {

        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        return template;
    }
}
