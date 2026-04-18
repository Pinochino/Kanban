package com.example.trello.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateChatGroupRequest {

    @NotBlank
    String name;

    String description;

    @Builder.Default
    List<Long> memberIds = new ArrayList<>();
}