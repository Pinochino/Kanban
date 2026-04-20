package com.example.trello.utils;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    AccountRepository accountRepository;

    @Autowired
    public JwtUtil(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public Account getCurrentUserLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        String email = null;
        Object principal = authentication.getPrincipal();

        if (principal instanceof Jwt jwt) {
            email = jwt.getSubject();
        } else if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            email = jwtAuthenticationToken.getToken().getSubject();
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String principalName) {
            email = principalName;
        }

        if (email == null || email.isBlank()) {
            throw new AppError(ErrorCode.USER_NOT_FOUND);
        }

        return accountRepository.findAccountByEmail(email)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
    }
}
