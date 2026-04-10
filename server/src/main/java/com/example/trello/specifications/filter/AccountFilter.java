package com.example.trello.specifications.filter;


import com.example.trello.dto.request.DataToolRequest;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@SuperBuilder
public class AccountFilter extends DataToolRequest {

    String username;

    Boolean active;

    Boolean login;

    Long roleId;


}
