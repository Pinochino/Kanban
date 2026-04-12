package com.example.trello.config;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import com.example.trello.security.CustomUserDetail;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Configuration
class SpringSecurityAuditorAware implements AuditorAware<Account> {

    AccountRepository accountRepository;

    @Autowired
    public SpringSecurityAuditorAware(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public @NonNull Optional<Account> getCurrentAuditor() {

        return Optional.of(SecurityContextHolder.getContext())
                .map(SecurityContext::getAuthentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .map(principal -> {
                    if (principal instanceof Jwt) {
                        String email = ((Jwt) principal).getSubject();
                        log.info(email);

                        return accountRepository
                                .findAccountByEmail(email)
                                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
                    }
                    return null;
                });
    }

}
