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

    long timestamp;

    int code;

    String message;

    String stacktrace;

    T data;

    public AppResponse(int code, String message) {
        this.timestamp = System.currentTimeMillis();
        this.code = code;
        this.message = message;
    }

    public AppResponse(int code, String message, String stacktrace) {
        this.timestamp = System.currentTimeMillis();
        this.code = code;
        this.message = message;
        this.stacktrace = stacktrace;
    }

    public AppResponse(int code, String message, T data) {
        this.timestamp = System.currentTimeMillis();
        this.code = code;
        this.message = message;
        this.data = data;
    }

}
