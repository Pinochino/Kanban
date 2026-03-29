package com.example.trello.constants;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;


@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {

    USER_ALREADY_EXIST(100, "User already existed", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(101, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    USER_NOT_FOUND(102, "User Not Found", HttpStatus.NOT_FOUND),
    INVALID_TOKEN(103, "Invalid token", HttpStatus.UNAUTHORIZED),

    ;

    int code;
    String message;
    HttpStatus status;
}
