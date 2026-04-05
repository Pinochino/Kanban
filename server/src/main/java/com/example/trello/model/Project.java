package com.example.trello.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Project extends AbstractEntity implements Serializable {

    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long projectId;

    String title;

    String description;

    boolean isPublic;

    boolean isDeleted;

    @ManyToOne()
    @JoinColumn(name = "account_id")
    @JsonManagedReference
    Account account;

    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "project")
    @JsonManagedReference
    List<ListTask> listTasks = new ArrayList<>();

    @Builder.Default
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "project")
    @JsonManagedReference
    List<ProjectLabel> projectLabels = new ArrayList<>();


}
