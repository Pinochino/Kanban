package com.example.trello.specifications;

import com.example.trello.model.Account;
import com.example.trello.model.Role;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class AccountSpecifications {

    public static Specification<Account> filterById(Long accountId) {
        return (root, query, cb) -> {
            if (accountId == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("id"), accountId);
        };
    }

    public static Specification<Account> filterByUsername(String username) {
        return (root, query, cb) -> {
            if (username == null || username.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(root.get("username"), "%" + username + "%");
        };
    }


    public static Specification<Account> filterByActive(Boolean active) {
        return ((root, query, cb) -> {
            if (active == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("isActive"), active);
        }
        );
    }

    public static Specification<Account> filterByRoleId(Long roleId) {

        return (((root, query, cb) -> {
            if (roleId == null) {
                return cb.conjunction();
            }

            Join<Account, Role> accountRoleJoin = root.join("roles", JoinType.INNER);
            query.distinct(true);


            return cb.equal(accountRoleJoin.get("id"), roleId);
        }));
    }

    public static Specification<Account> filterByLogin(Boolean login) {
        return ((root, query, cb) -> {
            if (login == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("isLogin"), login);
        });
    }

    public static Specification<Account> filterByDeleted(Boolean deleted) {
        return ((root, query, cb) -> {
            if (deleted == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("isDeleted"), deleted);
        });
    }

}
