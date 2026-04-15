package com.example.trello.repository;

import com.example.trello.constants.RoleName;
import com.example.trello.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {
    @Query("select acc from Account acc where acc.email = ?1 and acc.isDeleted = false")
    Optional<Account> findUserByEmail(String email);

    @Query("select acc from Account acc where acc.email = ?1 and acc.isDeleted = false")
    Optional<Account> findAccountByEmail(String email);

    @Query("select count(acc) from Account acc where acc.isActive = ?1 and acc.isDeleted = false")
    Long countAccountByActive(boolean active);

    @Query("select count(distinct(acc)) from Account acc join acc.roles r on r.name = ?1 where acc.isDeleted = false")
    Long countAccountByRoleName(RoleName roleName);

    @Query("select count(acc) from Account acc where acc.isLogin = ?1 and acc.isDeleted = false")
    Long countAccountByLogin(Boolean login);


    @Query("select acc from Account acc where acc.isDeleted = ?1")
    List<Account> findAccountsByDeleted(boolean deleted);
}
