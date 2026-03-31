package com.example.trello.model;

import com.example.trello.constants.TokenType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.util.concurrent.TimeUnit;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@RedisHash("RedisHash")
public class RedisToken {

    @Id
    String jwtId;

    @Enumerated(EnumType.STRING)
    TokenType tokenType;

    long userId;

    @TimeToLive(unit = TimeUnit.MILLISECONDS)
    private Long expiredTime;

}
