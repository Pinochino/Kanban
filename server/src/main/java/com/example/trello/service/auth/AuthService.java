package com.example.trello.service.auth;

import com.example.trello.dto.request.LoginRequest;
import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.LoginResponse;
import com.example.trello.model.Account;
import jakarta.transaction.Transactional;

public interface AuthService {
    Account findUserByEmail(String email);

    @Transactional
    AccountResponse createUser(RegisterRequest request);

    LoginResponse authenticate(LoginRequest request);
}
