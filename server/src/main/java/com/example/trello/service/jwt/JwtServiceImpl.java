package com.example.trello.service.jwt;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.TokenType;
import com.example.trello.dto.response.JwtInfo;
import com.example.trello.dto.response.TokenPayload;
import com.example.trello.exception.AppError;
import com.example.trello.model.Account;
import com.example.trello.model.RedisToken;
import com.example.trello.repository.RedisTokenRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.text.ParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class JwtServiceImpl implements JwtService {

    @Value("${JWT_ACCESS_KEY}")
    String secretKey;

    @Value("${JWT_ACCESS_EXPIRE}")
    long issuerToken;

    RedisTokenRepository redisTokenRepository;

    @Autowired
    public JwtServiceImpl(RedisTokenRepository redisTokenRepository) {
        this.redisTokenRepository = redisTokenRepository;
    }


    @Override
    public TokenPayload generateAccessToken(Account account) {

//       HEADER
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Date issueTime = new Date();
        Date expiredTime = Date.from(issueTime.toInstant().plus(issuerToken, ChronoUnit.SECONDS));
        String jwtId = UUID.randomUUID().toString();

        Set<String> roles = account.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.toSet());

//        PAYLOAD
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(account.getEmail())
                .issueTime(issueTime)
                .expirationTime(expiredTime)
                .jwtID(jwtId)
                .claim("roles", roles)
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secretKey));
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }

        String token = jwsObject.serialize();
        return TokenPayload.builder()
                .token(token)
                .jwtId(jwtId)
                .expiredTime(expiredTime)
                .build();
    }

    @Override
    public String generateRefreshToken() {
        SecureRandom random = new SecureRandom();
        byte[] randomBytes = new byte[32];
        random.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Override
    public String hashRefreshToken(String refreshToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(refreshToken.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public boolean verifyToken(String token) {

        SignedJWT signedJWT = null;

        try {
            signedJWT = SignedJWT.parse(token);

            // Verify signature
            boolean validSignature = signedJWT.verify(new MACVerifier(secretKey));
            if (!validSignature) {
                throw new AppError(ErrorCode.INVALID_JWT_SIGNATURE);
            }

            // Check expiration
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            if (expirationTime == null || expirationTime.before(new Date())) {
                throw new AppError(ErrorCode.TOKEN_HAS_EXPIRED);
            }

            // Check blacklist (Redis)
            String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
            Optional<RedisToken> byId = redisTokenRepository.findByJwtIdAndTokenType(jwtId, TokenType.ACCESS_TOKEN);

            if (byId.isPresent()) {
                throw new AppError(ErrorCode.JWT_INVALID);
            }

            return true;
        } catch (ParseException e) {
            throw new AppError(ErrorCode.INVALID_TOKEN_FORMAT);
        } catch (JOSEException e) {
            throw new AppError(ErrorCode.TOKEN_VERIFICATION_FAILED);
        }

    }

    @Override
    public JwtInfo parseToken(String token) {

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
            Date issueTime = signedJWT.getJWTClaimsSet().getIssueTime();
            Date expiredTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            return JwtInfo.builder()
                    .jwtId(jwtId)
                    .issueTime(issueTime)
                    .expiredTime(expiredTime)
                    .build();

        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }
}
