package com.example.trello.service.account;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.UpdateAccountRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.AccountMapper;
import com.example.trello.model.Account;
import com.example.trello.model.Role;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.RoleRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AccountServiceImpl implements AccountService {

    AccountRepository accountRepository;
    AccountMapper accountMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public List<AccountResponse> getAccounts(AccountFilter request) {

        Specification<Account> spec = Specification
                .where(AccountSpecifications.filterByRoleId(request.getRoleId()))
                .and(AccountSpecifications.filterByActive(request.getActive()))
                .and(AccountSpecifications.filterByUsername(request.getUsername()))
            .and(AccountSpecifications.filterByLogin(request.getLogin()))
            .and(AccountSpecifications.filterByDeleted(false));


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
    public Account findAccountByEmail(String email) {
        return accountRepository.findAccountByEmail(email).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
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

    @Override
    public Long countAccounts() {
        Specification<Account> spec = Specification.where(AccountSpecifications.filterByDeleted(false));
        return accountRepository.count(spec);
    }

    @Override
    public void softDelete(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        account.setDeleted(true);
        accountRepository.save(account);
    }

    @Override
    public void restore(Long id) {
        Account account = accountRepository.findById(id).orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));
        account.setDeleted(false);
        accountRepository.save(account);
    }

    @Override
    public List<AccountResponse> sortDeleteAccounts() {
        List<Account> accounts = accountRepository.findAccountsByDeleted(true);
        return accounts.stream().map(accountMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public AccountResponse updateAccount(Long accountId, UpdateAccountRequest request) {
        Account oldAccount = accountRepository
                .findById(accountId)
                .orElseThrow(() -> new AppError(ErrorCode.USER_NOT_FOUND));

        if (StringUtils.hasText(request.getUsername())) {
            oldAccount.setUsername(request.getUsername().trim());
        }

        if (StringUtils.hasText(request.getEmail())) {
            oldAccount.setEmail(request.getEmail().trim());
        }

        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new AppError(ErrorCode.ROLE_NOT_FOUND));
            boolean check = oldAccount.getRoles().stream().anyMatch(r -> r.getId().equals(role.getId()));

            if (!check) {
                oldAccount.getRoles().clear();
                oldAccount.getRoles().add(role);
            }
        }

        if (StringUtils.hasText(request.getPassword())) {
            oldAccount.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        oldAccount = accountRepository.save(oldAccount);

        return accountMapper.toResponse(oldAccount);
    }


}
