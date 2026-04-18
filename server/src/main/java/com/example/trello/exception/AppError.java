package com.example.trello.exception;

import com.example.trello.constants.ErrorCode;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppError extends RuntimeException {

    long timestamp;
    ErrorCode errorCode;

    public AppError(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.timestamp = System.currentTimeMillis();
        this.errorCode = errorCode;
    }

}
