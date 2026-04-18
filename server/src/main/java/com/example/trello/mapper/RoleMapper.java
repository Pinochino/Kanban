package com.example.trello.mapper;

import com.example.trello.dto.response.RoleResponse;
import com.example.trello.model.Role;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    RoleResponse mapToResponse(Role role);
}
