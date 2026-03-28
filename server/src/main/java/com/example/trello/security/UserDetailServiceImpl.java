package com.example.trello.security;

import com.example.trello.constants.ErrorCode;
import com.example.trello.exception.AppError;
import com.example.trello.model.User;
import com.example.trello.repository.UserRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserDetailServiceImpl implements UserDetailsService {

    UserRepository userRepository;

    @Autowired
    public UserDetailServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User oldUser = userRepository.findUserByEmail(username)
                .orElseThrow(() -> new AppError(ErrorCode.INVALID_CREDENTIALS));

        return new CustomUserDetail(oldUser);
    }
}
