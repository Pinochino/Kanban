package com.example.trello.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "checklist")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Checklist extends AbstractEntity implements Serializable {

    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long checklistId;

    String title;

    Long orderIndex;

    boolean isChecked;

    @ManyToOne
    @JoinColumn(name = "task_id")
    @JsonBackReference
    Task task;

    @OneToMany(mappedBy = "checklist")
    @JsonManagedReference
    @Builder.Default
    List<CheckListItem> checkListItems = new ArrayList<>();
}
