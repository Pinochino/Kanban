package com.example.trello.service.account;

import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.UpdateAccountRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.model.Account;
import com.example.trello.specifications.filter.AccountFilter;
import jakarta.transaction.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    Long countAccounts();

    void softDelete(Long id);

    void restore(Long id);

    List<AccountResponse> sortDeleteAccounts();

    AccountResponse updateAccount(Long accountId, UpdateAccountRequest request);

    AccountResponse updateAccountProfile(Long accountId, UpdateAccountRequest request, MultipartFile avatarFile);
}
