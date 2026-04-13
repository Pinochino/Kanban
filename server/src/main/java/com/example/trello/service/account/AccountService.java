package com.example.trello.service.account;

import com.example.trello.constants.RoleName;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.model.Account;
import com.example.trello.specifications.filter.AccountFilter;
import jakarta.transaction.Transactional;

import java.util.List;

public interface AccountService {
    public abstract List<AccountResponse> getAccounts(AccountFilter request);

    public abstract AccountResponse getAccount(Long id);

    @Transactional
    public abstract void deleteAccount(Long id);

    @Transactional
    public abstract void deleteAccounts();

    @Transactional
    void updateActiveAccount(Long id, boolean active);

    Account findAccountByEmail(String email);

    Long countAccountLock(boolean active);

    Long countAccountLogin(boolean login);

    Long countAccountByRoleName(RoleName roleName);
}
