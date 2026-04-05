package com.example.trello.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public class AccountResponse {

     Long accountId;

    String username;

    String email;

    @Builder.Default
    Set<RoleResponse> roles = new HashSet<>();

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
