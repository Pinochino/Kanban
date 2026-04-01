package com.example.trello.service.account;

import com.example.trello.dto.request.DataToolRequest;
import com.example.trello.dto.response.AccountResponse;
import jakarta.transaction.Transactional;

import java.util.List;

public interface AccountService {
    public abstract List<AccountResponse> getAccounts(DataToolRequest request);

    public abstract AccountResponse getAccount(Long id);

    @Transactional
    public abstract void deleteAccount(Long id);

    @Transactional
    public abstract void deleteAccounts();
}
