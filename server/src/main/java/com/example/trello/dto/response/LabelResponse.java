package com.example.trello.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LabelResponse {

    Long id;

    String title;

    String color;

    LocalDateTime createdAt;

    LocalDateTime updatedAt;
}
