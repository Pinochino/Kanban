package com.example.trello.mapper;

import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    TaskMapper INSTANCE = Mappers.getMapper(TaskMapper.class);

    TaskResponse toTaskResponse(Task task);

    Task toTask(TaskRequest request);

    void updateTask(@MappingTarget Task task,
                    TaskRequest request);
}
