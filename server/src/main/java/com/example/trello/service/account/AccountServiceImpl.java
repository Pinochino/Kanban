package com.example.trello.service.account;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.DataToolRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.AccountMapper;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import com.example.trello.specifications.AccountSpecifications;
import com.example.trello.specifications.filter.AccountFilter;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AccountServiceImpl implements AccountService {

    AccountRepository accountRepository;
    AccountMapper accountMapper;

    @Override
    public List<AccountResponse> getAccounts(AccountFilter request) {

        Specification<Account> spec = Specification
                .where(AccountSpecifications.filterByRoleId(request.getRoleId()))
                .and(AccountSpecifications.filterByActive(request.getActive()))
                .and(AccountSpecifications.filterByUsername(request.getUsername()))
                .and(AccountSpecifications.filterByLogin(request.getLogin()));


        Sort sort = request.isAscending() ? Sort.by(request.getSortBy()).ascending()
                : Sort.by(request.getSortBy()).descending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        return accountRepository.findAll(spec, pageable)
                .stream()
                .map(accountMapper::toResponse)
                .toList();
    }

    @Override
    public AccountResponse getAccount(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        return accountMapper.toResponse(account);
    }

    @Transactional
    @Override
    public void deleteAccount(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        accountRepository.delete(account);
    }

    @Transactional
    @Override
    public void deleteAccounts() {
        accountRepository.deleteAll();
    }

    @Transactional
    @Override
    public void updateActiveAccount(Long id, boolean active) {

        Account account = accountRepository
                .findById(id)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        account.setActive(active);
        account = accountRepository.save(account);
    }

    @Override
    public Long countAccountLock(boolean active) {
        return accountRepository.countAccountByActive(active);
    }

    @Override
    public Long countAccountLogin(boolean login) {
        return accountRepository.countAccountByLogin(login);
    }

    @Override
    public Long countAccountByRoleName(RoleName roleName) {
        return accountRepository.countAccountByRoleName(roleName);
    }

    

}
