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

    INVALID_EXCEPTION(999, "Invalid exception", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_ALREADY_EXIST(100, "User already existed", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(101, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    USER_NOT_FOUND(102, "User Not Found", HttpStatus.NOT_FOUND),
    INVALID_TOKEN(103, "Invalid token", HttpStatus.UNAUTHORIZED),
    EMAIL_IS_MANDATORY(104, "Email is mandatory", HttpStatus.BAD_REQUEST),
    USERNAME_IS_MANDATORY(105, "Username is mandatory", HttpStatus.BAD_REQUEST),
    PASSWORD_IS_MANDATORY(106, "Password is mandatory", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(107, "Password has at least {min} and {max} characters", HttpStatus.BAD_REQUEST),
    ;

    int code;
    String message;
    HttpStatus status;


}
