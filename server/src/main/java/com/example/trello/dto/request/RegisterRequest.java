package com.example.trello.dto.request;

import com.example.trello.constants.ErrorCode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class RegisterRequest {

    @NotBlank(message = "USERNAME_IS_MANDATORY")
    @Size(min = 3, message = "Username has at least {} characters")
    String username;

    @NotBlank(message = "EMAIL_IS_MANDATORY")
    @Email(message = "Email is not valid format")
    String email;

    @NotBlank(message = "PASSWORD_IS_MANDATORY")
    @Size(min = 4, max = 6, message = "INVALID_PASSWORD")
    String password;

}
