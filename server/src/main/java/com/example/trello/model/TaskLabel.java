package com.example.trello.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serial;
import java.io.Serializable;

@Entity
@Table(name = "task_label")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskLabel extends AbstractEntity implements Serializable {

    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long taskLabelId;

    @ManyToOne
    @JoinColumn(name = "project_label_id")
    ProjectLabel projectLabel;

    @ManyToOne
    @JoinColumn(name = "task_id")
    Task task;
}
