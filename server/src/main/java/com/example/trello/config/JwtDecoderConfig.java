package com.example.trello.config;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.service.jwt.JwtService;
import com.example.trello.service.jwt.JwtServiceImpl;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Objects;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class JwtDecoderConfig implements JwtDecoder {

    final JwtService jwtService;
    NimbusJwtDecoder nimbusJwtDecoder = null;

    @Value("${JWT_ACCESS_KEY}")
    String secretKey;

    @Autowired
    public JwtDecoderConfig(JwtService jwtService
    ) {
        this.jwtService = jwtService;
    }

    @Override
    public Jwt decode(String token) throws JwtException {

        log.info("Decoding token: {}", token);

        try {
            if (!jwtService.verifyToken(token)) {
                throw new AppError(ErrorCode.INVALID_TOKEN);
            }

            if (Objects.isNull(nimbusJwtDecoder)) {

                SecretKey secretKey1 = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HS512");

                nimbusJwtDecoder = NimbusJwtDecoder
                        .withSecretKey(secretKey1)
                        .macAlgorithm(MacAlgorithm.HS512)
                        .build();
            }

        } catch (ParseException e) {
            throw new RuntimeException(e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }

        return nimbusJwtDecoder.decode(token);
    }


}
