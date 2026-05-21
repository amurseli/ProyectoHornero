package com.hornero.config;

import com.hornero.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        if (message.isEmpty()) message = "Datos inválidos";
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(message, HttpStatus.BAD_REQUEST.value()));
    }

    private String formatFieldError(FieldError fe) {
        String msg = fe.getDefaultMessage();
        return (msg != null ? msg : "valor inválido") + " (" + fe.getField() + ")";
    }
}
