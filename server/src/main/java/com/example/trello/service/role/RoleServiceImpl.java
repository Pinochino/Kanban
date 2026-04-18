package com.example.trello.service.role;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.trello.dto.response.RoleResponse;
import com.example.trello.mapper.RoleMapper;
import com.example.trello.repository.RoleRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {
    
    RoleRepository roleRepository;
    RoleMapper roleMapper;

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream().map(role -> roleMapper.mapToResponse(role)).toList();
    }

}
