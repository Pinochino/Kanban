package com.example.trello.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
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
@Table(name = "tasks")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Task extends AbstractEntity implements Serializable {


    @Serial
    static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long taskId;

    @Column(unique = true)
    String title;

    String description;

    Long orderIndex;

    @Builder.Default
    boolean isActive = true;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDateTime dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDateTime reminderDate;

    @ManyToOne
    @JoinColumn(name = "list_task_id")
    @JsonBackReference
    ListTask listTask;


    @OneToMany(mappedBy = "task")
    @JsonManagedReference
    @Builder.Default
    List<TaskAttachment> attachments = new ArrayList<>();


    @OneToMany(mappedBy = "task")
    @JsonManagedReference
    @Builder.Default
    List<Checklist> checklists = new ArrayList<>();

    @OneToMany(mappedBy = "task")
    @JsonManagedReference
    @Builder.Default
    List<TaskActivity> taskActivities = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "signed_account_id")
    @JsonBackReference
    Account assignedAccount;

}
