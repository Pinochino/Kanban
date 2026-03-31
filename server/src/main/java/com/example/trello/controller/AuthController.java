package com.example.trello.controller;

import com.example.trello.dto.request.LoginRequest;
import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.dto.response.LoginResponse;
import com.example.trello.service.auth.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
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
    public ResponseEntity<AppResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request,
                                                            HttpServletResponse response) {
        LoginResponse accountResponse = authService.authenticate(request);

        Cookie cookie = new Cookie("REFRESH_TOKEN", accountResponse.getRefreshToken());
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        response.addCookie(cookie);

        accountResponse.setRefreshToken(null);

        return ResponseEntity.ok().body(new AppResponse<>(200, "Login Successful", accountResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<AppResponse<AccountResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AccountResponse accountResponse = authService.createUser(request);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Register Successful", accountResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<AppResponse<Void>> logout(@RequestHeader("Authorization") String authHeader,
                                                    @CookieValue("REFRESH_TOKEN") String refreshToken
    ) {
        String accessToken = authHeader.replace("Bearer ", "");

        authService.logout(accessToken, refreshToken);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Logout Successful"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AppResponse<String>> refreshToken(@CookieValue("REFRESH_TOKEN") String refreshToken) {
        String newAccessToken = authService.refreshToken(refreshToken);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Refresh Token Successful", newAccessToken));
    }


}
