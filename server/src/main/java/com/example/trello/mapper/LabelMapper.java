package com.example.trello.mapper;

import com.example.trello.dto.request.LabelRequest;
import com.example.trello.dto.response.LabelResponse;
import com.example.trello.model.Label;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LabelMapper {

    LabelResponse toResponse(Label label);

    Label toDto(LabelRequest request);

    void updateLabel(@MappingTarget Label label, LabelRequest request);

}
