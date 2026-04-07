package com.example.trello.service.account;

import com.example.trello.constants.ErrorCode;
import com.example.trello.dto.request.DataToolRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.AccountMapper;
import com.example.trello.model.Account;
import com.example.trello.repository.AccountRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    AccountRepository accountRepository;
    AccountMapper accountMapper;


    @Override
    public List<AccountResponse> getAccounts(DataToolRequest request) {

        Sort sort = request.isAscending() ? Sort.by(request.getSortBy()).ascending() : Sort.by(request.getSortBy()).descending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        return accountRepository.findAll(pageable).stream().map(accountMapper::toResponse).toList();
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

}
