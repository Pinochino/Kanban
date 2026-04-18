package com.example.trello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AccountResponse {

    Long id;

    String username;

    String email;

    String avatarUrl;

    boolean isLogin;

    boolean isActive;

    boolean isDeleted;

    Set<RoleResponse> roles = new HashSet<>();

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
