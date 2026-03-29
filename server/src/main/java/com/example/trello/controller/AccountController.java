package com.example.trello.controller;

import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.model.Account;
import com.example.trello.service.account.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@CrossOrigin
public class AccountController {

    private AccountService accountService;

    @Autowired
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/list")
    public ResponseEntity<AppResponse<List<AccountResponse>>> getAccounts() {
        List<AccountResponse> accounts = accountService.getAccounts();
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get accounts", accounts));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<AppResponse<AccountResponse>> getAccount(@PathVariable Long id) {
        AccountResponse accountResponse = accountService.getAccount(id);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get account", accountResponse));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<AppResponse<Void>> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete account"));
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<AppResponse<Void>> deleteAllAccounts() {
        accountService.deleteAccounts();
        return ResponseEntity.ok().body(new AppResponse<>(200, "Delete all accounts"));
    }
}
