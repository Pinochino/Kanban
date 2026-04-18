package com.example.trello.config;

import com.example.trello.constants.RoleName;
import com.example.trello.model.Account;
import com.example.trello.model.Role;
import com.example.trello.repository.AccountRepository;
import com.example.trello.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class DataSeed implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public DataSeed(
            PasswordEncoder passwordEncoder,
            AccountRepository accountRepository,
            RoleRepository roleRepository
    ) {
        this.passwordEncoder = passwordEncoder;
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        String adminEmail = "admin@gmail.com";

        Optional<Role> adminRole = roleRepository.findRoleByName(RoleName.SUPER_ADMIN);
        List<Role> roles = List.of(
                new Role(RoleName.SUPER_ADMIN),
                new Role(RoleName.USER));

        if (adminRole.isEmpty()) {
            roleRepository.saveAll(roles);
        }

        Optional<Role> role = roleRepository.findRoleByName(RoleName.SUPER_ADMIN);

        Optional<Account> admin = accountRepository.findUserByEmail(adminEmail);

        if (admin.isEmpty()) {

            Account newAdmin = new Account();
            newAdmin.setUsername("admin");
            newAdmin.setEmail(adminEmail);
            newAdmin.setPassword(passwordEncoder.encode("123456"));
            newAdmin.addRole(role.get());

            accountRepository.save(newAdmin);
        }

    }
}
