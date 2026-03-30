package com.example.trello.exception;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.AppResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(AppError.class)
    public ResponseEntity<AppResponse<Void>> appError(AppError e) {

        ErrorCode errorCode = e.getErrorCode();

        Throwable root = e;

        while (root.getCause() != null) {
            root = root.getCause();
        }

        return ResponseEntity.status(errorCode.getStatus()).body(new AppResponse<>(errorCode.getCode(), errorCode.getMessage(), root.toString()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AppResponse<Map<String, String>>> methodArgumentNotValidException(MethodArgumentNotValidException e) {

        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AppResponse<>(400, message));
    }


}
