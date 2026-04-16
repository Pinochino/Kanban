package com.example.trello.mapper;

import com.example.trello.dto.request.TaskRequest;
import com.example.trello.dto.response.TaskResponse;
import com.example.trello.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {AccountMapper.class})
public interface TaskMapper {

    TaskMapper INSTANCE = Mappers.getMapper(TaskMapper.class);

    @Mapping(target = "projectId", source = "listTask.project.id")
    @Mapping(target = "listTaskId", source = "listTask.id")
    @Mapping(target = "listTaskStatus", source = "listTask.status")
    TaskResponse toTaskResponse(Task task);

    Task toTask(TaskRequest request);

    void updateTask(@MappingTarget Task task,
                    TaskRequest request);
}
