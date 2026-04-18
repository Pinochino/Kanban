package com.example.trello.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = PRIVATE)
public class DashboardStatsResponse {

    long totalUsers;

    long totalProjects;

    long totalTasks;

    long unfinishedTasks;

    List<StatusCountResponse> statusDistribution;
}