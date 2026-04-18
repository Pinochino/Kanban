package com.example.trello.config;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import com.example.trello.service.account.AccountService;
import lombok.AccessLevel;
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

import java.util.Optional;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Configuration
class SpringSecurityAuditorAware implements AuditorAware<String> {

    AccountService accountService;

    @Autowired
    public SpringSecurityAuditorAware(
            AccountService accountService) {
        this.accountService = accountService;
    }

    @Override
    public @NonNull Optional<String> getCurrentAuditor() {

        return Optional.of(SecurityContextHolder.getContext())
                .map(SecurityContext::getAuthentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .map(principal -> {
                    if (principal instanceof Jwt) {
                        return ((Jwt) principal).getSubject();
                    }
                    return null;
                });
    }

}
