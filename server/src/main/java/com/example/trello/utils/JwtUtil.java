package com.example.trello.utils;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    AccountRepository accountRepository;

    @Autowired
    public JwtUtil(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public Account getCurrentUserLogin() {
        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = jwt.getSubject();

        return accountRepository.findAccountByEmail(email)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
    }
}
