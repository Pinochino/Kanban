package com.example.trello.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@SuperBuilder
public class DataToolRequest {

    @Builder.Default
    int page = 0;
    @Builder.Default

    int size = 5;
    @Builder.Default

    String sortBy = "id";
    @Builder.Default

    boolean ascending = true;
}
