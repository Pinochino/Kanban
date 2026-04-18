package com.example.trello.security;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserDetailServiceImpl implements UserDetailsService {

    AccountRepository accountRepository;

    @Autowired
    public UserDetailServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }


    @Override
    public @NonNull UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Account oldAccount = accountRepository.findUserByEmail(username)
                .orElseThrow(() -> new AppError(ErrorCode.INVALID_CREDENTIALS));

        return new CustomUserDetail(oldAccount);
    }
}
