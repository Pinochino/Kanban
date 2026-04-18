package com.example.trello.repository;

import com.example.trello.constants.ListTaskStatus;
import com.example.trello.model.Account;
import com.example.trello.model.ListTask;
import com.example.trello.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Optional<Task> findByTitle(String title);

    List<Task> findTaskByAssignedAccountAndListTask(Account account, ListTask listTask);

    List<Task> findTaskByListTask(ListTask listTask);

    long countByListTask(ListTask listTask);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Task t set t.assignedAccount = null where t.assignedAccount.id = :accountId")
    int clearAssignedAccountByAccountId(@Param("accountId") Long accountId);

    @Query(value = """
            select t from Task t
            join t.listTask lt
            join lt.project p
            left join t.assignedAccount a
            where (:projectId is null or p.id = :projectId)
                and (:status is null or lt.status = :status)
                and (:assignedAccountId is null or a.id = :assignedAccountId)
                and (
                            :keyword is null or trim(:keyword) = ''
                            or lower(t.title) like lower(concat('%', :keyword, '%'))
                            or lower(coalesce(t.description, '')) like lower(concat('%', :keyword, '%'))
                            or lower(coalesce(a.username, '')) like lower(concat('%', :keyword, '%'))
                            or str(t.id) like concat('%', :keyword, '%')
                            or lower(p.title) like lower(concat('%', :keyword, '%'))
                )
            """,
            countQuery = """
            select count(t) from Task t
            join t.listTask lt
            join lt.project p
            left join t.assignedAccount a
            where (:projectId is null or p.id = :projectId)
                and (:status is null or lt.status = :status)
                and (:assignedAccountId is null or a.id = :assignedAccountId)
                and (
                            :keyword is null or trim(:keyword) = ''
                            or lower(t.title) like lower(concat('%', :keyword, '%'))
                            or lower(coalesce(t.description, '')) like lower(concat('%', :keyword, '%'))
                            or lower(coalesce(a.username, '')) like lower(concat('%', :keyword, '%'))
                            or str(t.id) like concat('%', :keyword, '%')
                            or lower(p.title) like lower(concat('%', :keyword, '%'))
                )
            """)
    Page<Task> searchTasks(@Param("status") ListTaskStatus status,
                           @Param("keyword") String keyword,
                           @Param("projectId") Long projectId,
                           @Param("assignedAccountId") Long assignedAccountId,
                           Pageable pageable);
}
