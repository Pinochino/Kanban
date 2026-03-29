package com.example.trello.service.auth;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.LoginRequest;
import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.AccountMapper;
import com.example.trello.model.Account;
import com.example.trello.model.Role;
import com.example.trello.repository.RoleRepository;
import com.example.trello.repository.AccountRepository;
import com.example.trello.security.CustomUserDetail;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
public class AuthServiceImpl implements AuthService {

    AccountRepository accountRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    AccountMapper accountMapper;
    AuthenticationManager authenticationManager;

    @Autowired
    public AuthServiceImpl(AccountRepository accountRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AccountMapper accountMapper,
                           AuthenticationManager authenticationManager) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountMapper = accountMapper;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public Account findUserByEmail(String email) {
        return accountRepository.findUserByEmail(email).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    @Override
    public AccountResponse createUser(RegisterRequest request) {
        Optional<Account> user = accountRepository.findUserByEmail(request.getEmail());

        if (user.isPresent()) {
            throw new AppError(ErrorCode.USER_ALREADY_EXIST);
        }

        Optional<Role> role = Optional.of(roleRepository.findRoleByName(RoleName.USER).orElseGet(() -> {
            Role newRole = new Role();
            newRole.setName(RoleName.USER);
            roleRepository.save(newRole);
            return newRole;
        }));


        Account newAccount = accountMapper.toUser(request);
        newAccount.setPassword(passwordEncoder.encode(request.getPassword()));
        newAccount.addRole(role.get());

        accountRepository.save(newAccount);

        return accountMapper.toResponse(newAccount);
    }

    @Override
    public AccountResponse authenticate(LoginRequest request) {

        Authentication authenticationRequest = UsernamePasswordAuthenticationToken
                .unauthenticated(
                        request.getEmail(),
                        request.getPassword()
                );

        if (authenticationManager == null) {
            throw new AppError(ErrorCode.INVALID_CREDENTIALS);
        }

        Authentication authenticated = this.authenticationManager.authenticate(authenticationRequest);

        SecurityContextHolder.getContext().setAuthentication(authenticated);

        CustomUserDetail userDetail = (CustomUserDetail) authenticated.getPrincipal();

        Account accountLogin = userDetail.getAccount();

        if (accountLogin == null) {
            throw new AppError(ErrorCode.INVALID_CREDENTIALS);
        }

        return accountMapper.toResponse(accountLogin);
    }

}
