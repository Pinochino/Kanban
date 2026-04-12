package com.example.trello.security;

import com.example.trello.model.Account;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomUserDetail implements UserDetails, CredentialsContainer {

    Account account;
    String prefixRole = "ROLE_";

    public CustomUserDetail(Account account) {
        this.account = account;
    }

    @Override
    public @NonNull Collection<? extends GrantedAuthority> getAuthorities() {
        return account.getRoles()
                .stream()
                .map(role -> new SimpleGrantedAuthority(prefixRole + role.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public @NonNull String getPassword() {
        return account.getPassword();
    }

    @Override
    public @NonNull String getUsername() {
        return account.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return account.isActive();
    }

    @Override
    public void eraseCredentials() {
        this.account.setPassword(null);
    }

}
