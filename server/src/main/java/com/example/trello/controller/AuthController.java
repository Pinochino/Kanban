package com.example.trello.controller;

import com.example.trello.dto.request.LoginRequest;
import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.LoginResponse;
import com.example.trello.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class AuthController {

    final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AppResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse accountResponse = authService.authenticate(request);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Login Successful", accountResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<AppResponse<AccountResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AccountResponse accountResponse = authService.createUser(request);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Register Successful", accountResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<AppResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        authService.logout(token);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Logout Successful"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AppResponse<Void>> refreshToken() {
        return ResponseEntity.ok().body(new AppResponse<>(200, "Refresh Token Successful"));
    }


}
