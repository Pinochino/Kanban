package com.example.trello.service.jwt;

import com.example.trello.dto.response.JwtInfo;
import com.example.trello.dto.response.TokenPayload;
import com.example.trello.model.Account;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface JwtService {
    TokenPayload generateAccessToken(Account account);

    String generateRefreshToken();

    String hashRefreshToken(String refreshToken);

    boolean verifyToken(String token) throws ParseException, JOSEException;

    JwtInfo parseToken(String token);
}
