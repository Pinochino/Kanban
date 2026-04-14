package com.example.trello.controller;

import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.UpdateAccountRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.dto.response.AppResponse;
import com.example.trello.model.Account;
import com.example.trello.service.account.AccountService;
import com.example.trello.specifications.filter.AccountFilter;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@CrossOrigin
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AccountController {

    AccountService accountService;

    @GetMapping("/list")
    public ResponseEntity<AppResponse<List<AccountResponse>>> getAccounts(
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "5", required = false) int size,
            @RequestParam(value = "sort", defaultValue = "id", required = false) String sortBy,
            @RequestParam(value = "ascending", defaultValue = "false", required = false) Boolean ascending,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "roleId", required = false) Long roleId,
            @RequestParam(value = "active", required = false) Boolean isActive,
            @RequestParam(value = "login", required = false) Boolean isLogin) {

        AccountFilter request = AccountFilter.builder()
                .username(username)
                .roleId(roleId)
                .login(isLogin)
                .active(isActive)
                .size(size)
                .page(page)
                .ascending(ascending)
                .sortBy(sortBy)
                .build();

        List<AccountResponse> accounts = accountService.getAccounts(request);
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

    @PutMapping("/update/{accountId}")
    public ResponseEntity<AppResponse<AccountResponse>> updateAccount(@PathVariable Long accountId,
                                                                      @Valid @RequestBody UpdateAccountRequest request) {
        AccountResponse accountResponse = accountService.updateAccount(accountId, request);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Update account successfully", accountResponse));
    }


    @PatchMapping("/update-active/{accountId}")
    public ResponseEntity<AppResponse<Void>> updateAccountActive(
            @PathVariable("accountId") Long accountId,
            @RequestParam("active") Boolean active) {

        accountService.updateActiveAccount(accountId, active);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Update active account"));
    }

    @GetMapping("/count-active")
    public ResponseEntity<AppResponse<Long>> countActiveAccounts(
            @RequestParam("active") Boolean active) {
        log.info("active {}", active);

        Long accountActive = accountService.countAccountLock(active);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Count active account successfully ", accountActive));
    }

    @GetMapping("/count-login")
    public ResponseEntity<AppResponse<Long>> countLoginAccounts(
            @RequestParam("login") Boolean login) {
        Long accountLogin = accountService.countAccountLogin(login);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Count login account successfully", accountLogin));
    }

    @GetMapping("/count-by-role")
    public ResponseEntity<AppResponse<Long>> countByRoleName(
            @RequestParam(name = "name", required = true) String roleName) {

        Long accountByRole = accountService.countAccountByRoleName(RoleName.valueOf(roleName));
        return ResponseEntity.ok().body(new AppResponse<>(200, "Count by role successfully", accountByRole));
    }

    @PatchMapping("/soft-delete/{accountId}")
    public ResponseEntity<AppResponse<Void>> softDeleteAccount(@PathVariable Long accountId) {
        accountService.softDelete(accountId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Soft delete account successfully"));
    }

    @PatchMapping("/restore/{accountId}")
    public ResponseEntity<AppResponse<Void>> restoreAccount(@PathVariable Long accountId) {
        accountService.restore(accountId);
        return ResponseEntity.ok().body(new AppResponse<>(200, "Restore account successfully"));
    }

    @GetMapping("/soft-delete/list")
    public ResponseEntity<AppResponse<List<AccountResponse>>> getSoftDeleteAccounts() {
        List<AccountResponse> accountResponses = accountService.sortDeleteAccounts();
        return ResponseEntity.ok().body(new AppResponse<>(200, "Get soft delete accounts", accountResponses));
    }


}
