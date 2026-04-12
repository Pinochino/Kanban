package com.example.trello.repository;

import com.example.trello.constants.RoleName;
import com.example.trello.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {
    Optional<Account> findUserByEmail(String email);

    Optional<Account> findAccountByEmail(String email);

    @Query("select count(acc) from Account acc where acc.isActive = ?1")
    Long countAccountByActive(boolean active);

    @Query("select count(distinct(acc))  from  Account acc join acc.roles r on r.name=?1 ")
    Long countAccountByRoleName(RoleName roleName);

    @Query("select count(acc) from Account acc where acc.isLogin = ?1")
    Long countAccountByLogin(Boolean login);

}
