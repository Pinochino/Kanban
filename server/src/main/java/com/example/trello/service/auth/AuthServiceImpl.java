package com.example.trello.service.auth;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.constants.TokenType;
import com.example.trello.dto.request.LoginRequest;
import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.JwtInfo;
import com.example.trello.dto.response.LoginResponse;
import com.example.trello.dto.response.TokenPayload;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.AccountMapper;
import com.example.trello.model.Account;
import com.example.trello.model.RedisToken;
import com.example.trello.model.Role;
import com.example.trello.repository.RedisTokenRepository;
import com.example.trello.repository.RoleRepository;
import com.example.trello.repository.AccountRepository;
import com.example.trello.security.CustomUserDetail;
import com.example.trello.service.jwt.JwtService;
import com.example.trello.service.mail.MailService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
public class AuthServiceImpl implements AuthService {

    AccountRepository accountRepository;
    RoleRepository roleRepository;
    RedisTokenRepository redisTokenRepository;

    PasswordEncoder passwordEncoder;
    AuthenticationManager authenticationManager;

    AccountMapper accountMapper;
    JwtService jwtService;
    MailService mailService;


    @Override
    public Account findUserByEmail(String email) {
        return accountRepository.findUserByEmail(email).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    @Override
    public LoginResponse createUser(RegisterRequest request) {
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
        newAccount.setLogin(true);
        newAccount.addRole(role.get());

        accountRepository.save(newAccount);


        mailService.sendSimpleMessage(
                newAccount.getEmail(),
                "Register successfully",
                newAccount.getUsername(),
                "Nice to meet you");

        return authResponse(newAccount);
    }

    @Override
    public LoginResponse authenticate(LoginRequest request) {

        Authentication authenticationRequest = UsernamePasswordAuthenticationToken
                .unauthenticated(
                        request.getEmail(),
                        request.getPassword());

        if (authenticationManager == null) {
            throw new AppError(ErrorCode.INVALID_CREDENTIALS);
        }

        Authentication authenticated = this.authenticationManager.authenticate(authenticationRequest);

        SecurityContextHolder.getContext().setAuthentication(authenticated);

        CustomUserDetail userDetail = (CustomUserDetail) authenticated.getPrincipal();

        Account accountLogin = Objects.requireNonNull(userDetail).getAccount();

        if (accountLogin == null) {
            throw new AppError(ErrorCode.INVALID_CREDENTIALS);
        }

        accountLogin.setLogin(true);
        accountLogin = accountRepository.save(accountLogin);

        return authResponse(accountLogin);
    }

    private LoginResponse authResponse(Account account) {
        AccountResponse accountResponse = accountMapper.toResponse(account);
        TokenPayload accessTokenPayload = jwtService.generateAccessToken(account);
        String refreshToken = jwtService.generateRefreshToken();

        redisTokenRepository.save(
                RedisToken.builder()
                        .tokenType(TokenType.ACCESS_TOKEN)
                        .jwtId(accessTokenPayload.getJwtId())
                        .expiredTime(accessTokenPayload.getExpiredTime().getTime())
                        .build());

        redisTokenRepository.save(
                RedisToken.builder()
                        .tokenType(TokenType.REFRESH_TOKEN)
                        .expiredTime(Date.from(Instant.now().plusSeconds(60 * 60 * 24 * 7)).getTime())
                        .jwtId(jwtService.hashRefreshToken(refreshToken))
                        .userId(account.getId())
                        .build());


        return LoginResponse.builder()
                .accessToken(accessTokenPayload.getToken())
                .refreshToken(refreshToken)
                .account(accountResponse)
                .build();
    }

    @Override
    public void logout(String accessToken, String refreshToken) {

        JwtInfo jwtInfo = jwtService.parseToken(accessToken);
        String jwtId = jwtInfo.getJwtId();


        Date issueTime = jwtInfo.getIssueTime();
        Date expiredTime = jwtInfo.getExpiredTime();

        if (expiredTime.before(new Date())) {
            return;
        }

        // Black List Access Token
        RedisToken redisToken = RedisToken.builder()
                .jwtId(jwtId)
                .expiredTime(expiredTime.getTime() - issueTime.getTime())
                .tokenType(TokenType.ACCESS_TOKEN)
                .build();

        redisTokenRepository.save(redisToken);

        // Refresh token
        String hashRefreshToken = jwtService.hashRefreshToken(refreshToken);
        RedisToken oldRefreshToken = redisTokenRepository.findById(hashRefreshToken).orElseThrow(() ->
                new AppError(ErrorCode.USER_NOT_FOUND));

        Account account = accountRepository.findById(oldRefreshToken.getUserId()).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        account.setLogin(false);
        accountRepository.save(account);

        redisTokenRepository.deleteById(hashRefreshToken);

    }

    @Override
    public String refreshToken(String refreshToken) {

        String hashRefreshToken = jwtService.hashRefreshToken(refreshToken);

        Optional<RedisToken> refreshedToken = redisTokenRepository.findById(hashRefreshToken);

        if (refreshedToken.isEmpty()) {
            throw new AppError(ErrorCode.INVALID_CREDENTIALS);
        }

        Long userId = refreshedToken.get().getUserId();
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        TokenPayload accessToken = jwtService.generateAccessToken(account);

        redisTokenRepository.save(
                RedisToken.builder()

                        .tokenType(TokenType.ACCESS_TOKEN)
                        .jwtId(accessToken.getJwtId())
                        .expiredTime(accessToken.getExpiredTime().getTime())
                        .build());

        return accessToken.getToken();

    }

}
