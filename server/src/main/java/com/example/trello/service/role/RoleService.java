package com.example.trello.service.role;

import java.util.List;

import com.example.trello.dto.response.RoleResponse;

public interface RoleService {

    List<RoleResponse> getAllRoles();
    
}
