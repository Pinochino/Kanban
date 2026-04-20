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
    NOTIFICATION_NOT_FOUND(130, "Notification Not Found", HttpStatus.NOT_FOUND),
    NOTIFICATION_AUTHORIZED(131, "You don't have permission to access this notification", HttpStatus.FORBIDDEN),
    NOTIFICATION_INVALID_CHANNEL(132, "Notification channel is invalid", HttpStatus.BAD_REQUEST),
    CHAT_GROUP_NOT_FOUND(133, "Chat Group Not Found", HttpStatus.NOT_FOUND),
    CHAT_GROUP_FORBIDDEN(134, "You don't have permission to access this chat group", HttpStatus.FORBIDDEN),
    CHAT_GROUP_MEMBER_REQUIRED(135, "Chat group requires at least one other member", HttpStatus.BAD_REQUEST),
    CHAT_GROUP_NAME_INVALID(136, "Chat group name is invalid", HttpStatus.BAD_REQUEST),
    TASK_ATTACHMENT_FILE_REQUIRED(137, "Attachment file is required", HttpStatus.BAD_REQUEST),
    TASK_ATTACHMENT_UPLOAD_FAILED(138, "Task attachment upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    TASK_ATTACHMENT_NOT_FOUND(139, "Task attachment not found", HttpStatus.NOT_FOUND),
    TASK_ATTACHMENT_FILE_TOO_LARGE(140, "Task attachment exceeds max size", HttpStatus.BAD_REQUEST),
    TASK_ATTACHMENT_INVALID_FILE_TYPE(141, "Task attachment file type is not allowed", HttpStatus.BAD_REQUEST),
    ACCOUNT_SELF_DEACTIVATION_NOT_ALLOWED(142, "You cannot deactivate your own account", HttpStatus.FORBIDDEN),
    ACCOUNT_ADMIN_MANAGE_ADMIN_NOT_ALLOWED(143, "Admin cannot change active status of other admin accounts", HttpStatus.FORBIDDEN),
    ACCOUNT_PROFILE_UPDATE_NOT_ALLOWED(144, "You can only update your own profile", HttpStatus.FORBIDDEN),


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
