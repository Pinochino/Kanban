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

    //    AUTH_ERROR
    USER_ALREADY_EXIST(100, "User already existed", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS(101, "Invalid credentials", HttpStatus.UNAUTHORIZED),
    USER_NOT_FOUND(102, "User Not Found", HttpStatus.NOT_FOUND),
    INVALID_TOKEN(103, "Invalid token", HttpStatus.UNAUTHORIZED),
    EMAIL_IS_MANDATORY(104, "Email is mandatory", HttpStatus.BAD_REQUEST),
    USERNAME_IS_MANDATORY(105, "Username is mandatory", HttpStatus.BAD_REQUEST),
    PASSWORD_IS_MANDATORY(106, "Password is mandatory", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(107, "Password has at least {min} and {max} characters", HttpStatus.BAD_REQUEST),

    //    JWT
    INVALID_JWT_SIGNATURE(108, "Invalid JWT Signature", HttpStatus.UNAUTHORIZED),
    TOKEN_HAS_EXPIRED(109, "Token has expired", HttpStatus.UNAUTHORIZED),
    JWT_INVALID(110, "JWT is invalid", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN_FORMAT(111, "Invalid token format", HttpStatus.UNAUTHORIZED),
    TOKEN_VERIFICATION_FAILED(112, "Token verification failed", HttpStatus.UNAUTHORIZED),

    //  PROJECT_ERROR
    PROJECT_NOT_FOUND(113, "Project Not Found", HttpStatus.NOT_FOUND),
    PROJECT_ALREADY_EXIST(114, "Project already exist", HttpStatus.CONFLICT),
    PROJECT_AUTHORIZED(115, "You don't have a right to create project", HttpStatus.UNAUTHORIZED),

    // TASK
    TASK_NOT_FOUND(116, "Task Not Found", HttpStatus.NOT_FOUND),
    TASK_ALREADY_EXIST(117, "Task already exist", HttpStatus.CONFLICT),
    TASK_AUTHORIZED(123, "You don't have permission to update this task", HttpStatus.FORBIDDEN),
    TASK_DUE_DATE_INVALID(124, "Due date must be in the future", HttpStatus.BAD_REQUEST),
    TASK_REMINDER_DATE_INVALID(125, "Reminder date must be in the future", HttpStatus.BAD_REQUEST),
    TASK_REMINDER_AFTER_DUE_INVALID(126, "Reminder date must be before or equal to due date", HttpStatus.BAD_REQUEST),
    AVATAR_FILE_REQUIRED(127, "Avatar file is required", HttpStatus.BAD_REQUEST),
    AVATAR_INVALID_FILE_TYPE(128, "Avatar file must be an image", HttpStatus.BAD_REQUEST),
    AVATAR_UPLOAD_FAILED(129, "Avatar upload failed", HttpStatus.INTERNAL_SERVER_ERROR),


    //    LIST_TASK
    LIST_TASK_NOT_FOUND(118, "List Task Not Found", HttpStatus.NOT_FOUND),

    //    LABEL
    LABEL_NOT_FOUND(119, "Label Not Found", HttpStatus.NOT_FOUND),
    LABEL_ALREADY_EXIST(120, "Label already exist", HttpStatus.CONFLICT),


    //    ROLE
    ROLE_NOT_FOUND(121, "Role Not Found", HttpStatus.NOT_FOUND),
    ROLE_ALREADY_EXISTED(122, "Role already existed", HttpStatus.CONFLICT),

    ;

    int code;
    String message;
    HttpStatus status;


}
