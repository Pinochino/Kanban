package com.example.trello.dto.request;

import com.example.trello.model.Account;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectRequest {

    String title;

    String description;

    boolean isPublic;


}
