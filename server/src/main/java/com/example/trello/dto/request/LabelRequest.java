package com.example.trello.dto.request;

import jakarta.annotation.security.DenyAll;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LabelRequest {

    String title;

    String color;
    
    Long projectId;
}
