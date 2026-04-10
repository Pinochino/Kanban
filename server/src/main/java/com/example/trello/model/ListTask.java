package com.example.trello.model;

import com.example.trello.constants.ListTaskStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "list_task")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ListTask extends AbstractEntity implements Serializable {

    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long listTaskId;

    @Enumerated(EnumType.STRING)
    ListTaskStatus status;

    Long orderIndex;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "project_id")
    Project project;

    @OneToMany(mappedBy = "listTask", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    List<Task> tasks = new ArrayList<>();

    public ListTask(ListTaskStatus status, Project project) {
        this.status = status;
        this.project = project;
    }
}
