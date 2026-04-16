package com.example.trello.config;

import com.example.trello.constants.RoleName;
import com.example.trello.repository.AccountRepository;
import com.example.trello.security.UserDetailServiceImpl;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.List;
import java.util.stream.Collectors;


@Configuration
@EnableWebSecurity
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {

    CustomAuthenticationEntryPoint authenticationEntryPoint;

    String[] WHITE_LIST = {
            "/auth/**",
            "/files/**",
    };
    String[] ADMIN_LIST = {
            "/projects/create",
            "/projects/delete/**",
            "/projects/delete-all",
            "/accounts/**",
            "/tasks/create",
            "/tasks/update/**",
            "/tasks/delete/**",
            "/tasks/delete-all",
    };

    CustomAccessDeniedHandler accessDeniedHandler;
    JwtDecoderConfig jwtDecoderConfig;
    AccountRepository accountRepository;

    @Autowired
    public SecurityConfig(CustomAuthenticationEntryPoint authenticationEntryPoint,
                          JwtDecoderConfig jwtDecoderConfig,
                          CustomAccessDeniedHandler accessDeniedHandler,
                          AccountRepository accountRepository) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.jwtDecoderConfig = jwtDecoderConfig;
        this.accessDeniedHandler = accessDeniedHandler;
        this.accountRepository = accountRepository;
    }

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(WHITE_LIST).permitAll()
                        .requestMatchers(HttpMethod.GET, "/projects/list", "/projects/detail/**", "/tasks/list", "/tasks/detail/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/tasks/update-status/**").authenticated()
                        .requestMatchers(ADMIN_LIST).hasRole(RoleName.SUPER_ADMIN.name())
                        .anyRequest().authenticated()
                )
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoderConfig)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                        .authenticationEntryPoint(authenticationEntryPoint)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(ex -> ex
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailServiceImpl userDetails,
                                                       PasswordEncoder passwordEncoder) throws Exception {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetails);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<String> roles = jwt.getClaimAsStringList("roles");

            if (roles == null) return List.of();

            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });

        return converter;
    }


}
