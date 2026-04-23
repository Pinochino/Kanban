package com.example.trello.mapper;

import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.model.ListTask;
import com.example.trello.model.Project;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {
                ListTaskMapper.class,
                TaskMapper.class,
})
public interface ProjectMapper {

        ProjectMapper INSTANCE = Mappers.getMapper(ProjectMapper.class);

        @Mapping(target = "createdBy", source = "createdBy", ignore = true)
        @Mapping(target = "listTasks", source = "listTasks")
        ProjectResponse toResponse(Project project);

        Project toProject(ProjectRequest projectRequest);

        void updateProject(@MappingTarget Project project,
                        ProjectRequest projectRequest);

}
