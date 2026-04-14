package com.example.trello.mapper;

import com.example.trello.dto.request.RegisterRequest;
import com.example.trello.dto.request.UpdateAccountRequest;
import com.example.trello.dto.response.AccountResponse;
import com.example.trello.model.Account;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {
        RoleMapper.class
})
public interface AccountMapper {

    AccountMapper INSTANCE = Mappers.getMapper(AccountMapper.class);

    Account toUser(RegisterRequest request);

    AccountResponse toResponse(Account account);

    void updateAccount(@MappingTarget Account account,
                       UpdateAccountRequest request);

}
