package com.example.trello.repository;

import com.example.trello.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findUserByEmail(String email);

    Optional<Account> findAccountByEmail(String email);
}
