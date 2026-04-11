package com.example.trello.mapper;

import com.example.trello.dto.request.ProjectRequest;
import com.example.trello.dto.response.ProjectResponse;
import com.example.trello.model.Project;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {
        TaskMapper.class,
        LabelMapper.class
})
public interface ProjectMapper {

    ProjectMapper INSTANCE = Mappers.getMapper(ProjectMapper.class);

    ProjectResponse toResponse(Project project);

    Project toProject(ProjectRequest projectRequest);

    void updateProject(@MappingTarget Project project,
                       ProjectRequest projectRequest);

}
