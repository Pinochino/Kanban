package com.example.trello.service.jwt;

import com.example.trello.model.Account;

public interface JwtService {
    String generateAccessToken(Account account);

    String generateRefreshToken();
}
