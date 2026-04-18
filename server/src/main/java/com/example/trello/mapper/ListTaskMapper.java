package com.example.trello.mapper;

import org.mapstruct.Mapper;

import com.example.trello.dto.response.ListTaskResponse;
import com.example.trello.model.ListTask;

@Mapper(componentModel = "spring")
public interface ListTaskMapper {

    ListTaskResponse toResponse(ListTask listTask);

}
