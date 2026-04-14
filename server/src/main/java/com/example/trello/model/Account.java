package com.example.trello.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Account extends AbstractEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String username;

    @Column(unique = true)
    String email;

    String password;

    @Builder.Default
    @JsonProperty("is_login")
    boolean isLogin = Boolean.FALSE;


    @Builder.Default
    @JsonProperty("is_active")
    boolean isActive = Boolean.TRUE;

    @Builder.Default
    @JsonProperty("is_active")
    boolean isDeleted = Boolean.FALSE;

    @ManyToMany
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @JsonManagedReference
    @Builder.Default
    Set<Role> roles = new HashSet<>();

    // @OneToMany(mappedBy = "assignedAccount")
    // @JsonBackReference
    // @Builder.Default
    // List<Project> projects = new ArrayList<>();

    @OneToMany(mappedBy = "account")
    @JsonManagedReference
    @Builder.Default
    List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "account")
    @JsonManagedReference
    @Builder.Default
    List<TaskActivity> taskActivities = new ArrayList<>();

    @OneToMany(mappedBy = "account")
    @JsonManagedReference
    @Builder.Default
    List<ProjectMember> projectMembers = new ArrayList<>();

    @OneToMany(mappedBy = "assignedAccount")
    @JsonManagedReference
    @Builder.Default
    List<Task> tasks = new ArrayList<>();

    public void addRole(Role role) {
        this.roles.add(role);
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
    }

}
