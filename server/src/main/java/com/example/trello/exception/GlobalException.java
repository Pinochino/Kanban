package com.example.trello.exception;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.response.AppResponse;
import jakarta.validation.ConstraintViolation;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Objects;

@RestControllerAdvice
public class GlobalException {

    private static final String MIN_ATTRIBUTE = "min";

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

        FieldError fieldError = e.getBindingResult().getFieldErrors().getFirst();

        ErrorCode errorCode;

        var constraintViolation = e.getBindingResult().getFieldErrors().getFirst().unwrap(ConstraintViolation.class);


        Map attributes = Map.of();

        try {
            errorCode = ErrorCode.valueOf(fieldError.getDefaultMessage());
            attributes = constraintViolation.getConstraintDescriptor().getAttributes();
        } catch (Exception ex) {
            errorCode = ErrorCode.INVALID_EXCEPTION;
        }


        return ResponseEntity.status(errorCode.getStatus()).body(AppResponse.<Map<String, String>>builder()
                .code(errorCode.getCode())
                .timestamp(System.currentTimeMillis())
                .message(Objects.nonNull(attributes) ? mapAttribute(errorCode.getMessage(), attributes) : errorCode.getMessage()).build());

    }

    private String mapAttribute(String message, Map<String, Object> params) {

        if (params == null || params.isEmpty()) {
            return message;
        }

        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value != null) {
                message = message.replace("{" + key + "}", Objects.toString(value));
            }
        }

        return message;
    }


}
