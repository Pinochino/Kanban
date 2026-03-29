package com.example.trello.service.jwt;

import com.example.trello.model.Account;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface JwtService {
    String generateAccessToken(Account account);

    String generateRefreshToken();

    boolean verifyToken(String token) throws ParseException, JOSEException;
}
