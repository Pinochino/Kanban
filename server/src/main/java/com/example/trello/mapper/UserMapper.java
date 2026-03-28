package com.example.trello.mapper;

import com.example.trello.dto.request.CreateUserRequest;
import com.example.trello.dto.response.UserResponse;
import com.example.trello.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    User toUser(CreateUserRequest request);

    UserResponse toResponse(User user);


}
