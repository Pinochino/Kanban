package com.example.trello.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class DataToolRequest {

    int page = 0;

    int size = 5;

    String sortBy = "id";

    boolean ascending = true;
}
