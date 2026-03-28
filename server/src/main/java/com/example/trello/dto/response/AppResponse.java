package com.example.trello.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
@Builder
public class AppResponse<T> {

    int code;

    String message;

    T data;

    public AppResponse(int code, String message) {
        this.code = code;
        this.message = message;
    }

}
