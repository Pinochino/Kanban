package com.example.trello.service.account;

import com.example.trello.dto.response.AccountResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public abstract class AccountService {
    public abstract List<AccountResponse> getAccounts();

    public abstract AccountResponse getAccount(Long id);

    @Transactional
    public abstract void deleteAccount(Long id);

    @Transactional
    public abstract void deleteAccounts();
}
