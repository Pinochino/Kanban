package com.example.trello.model;

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

    @TimeToLive(unit = TimeUnit.MILLISECONDS)
    private Long expiredTime;


}
