package com.example.trello.exception;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.AppResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(AppError.class)
    public ResponseEntity<AppResponse<Void>> appError(AppError e) {

        ErrorCode errorCode = e.getErrorCode();

        return ResponseEntity.status(errorCode.getStatus()).body(
                new AppResponse<>(
                    errorCode.getCode(),
                    errorCode.getMessage()
                )
        );
    }


}
