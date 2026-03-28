package com.example.trello.service.auth;

import com.example.trello.constants.ErrorCode;
import com.example.trello.constants.RoleName;
import com.example.trello.dto.request.CreateUserRequest;
import com.example.trello.dto.response.UserResponse;
import com.example.trello.exception.AppError;
import com.example.trello.mapper.UserMapper;
import com.example.trello.model.Role;
import com.example.trello.model.User;
import com.example.trello.repository.RoleRepository;
import com.example.trello.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@FieldDefaults(level = AccessLevel.PACKAGE, makeFinal = true)
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;

    @Autowired
    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        Optional<User> user = userRepository.findUserByEmail(request.getEmail());

        if (user.isPresent()) {
            throw new AppError(ErrorCode.USER_ALREADY_EXIST);
        }

        Optional<Role> role = Optional.of(roleRepository.findRoleByName(RoleName.USER).orElseGet(() -> {
            Role newRole = new Role();
            newRole.setName(RoleName.USER);
            roleRepository.save(newRole);
            return newRole;
        }));


        User newUser = userMapper.toUser(request);
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.addRole(role.get());

        userRepository.save(newUser);

        return userMapper.toResponse(newUser);
    }

    public UserResponse authenticate() {
        return null;
    }

}
