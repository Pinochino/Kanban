package com.example.trello.dto.request;

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

    @NotBlank(message = "Username is mandatory")
    @Size(min = 3, message = "Username has at least {} characters")
    String username;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email is not valid format")
    String email;

    @NotBlank(message = "Password is mandatory")
    @Size(min = 4, message = "Password has at least {} characters")
    String password;

}
