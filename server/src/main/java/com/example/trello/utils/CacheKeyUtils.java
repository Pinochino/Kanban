package com.example.trello.utils;

import com.example.trello.specifications.filter.AccountFilter;

public final class CacheKeyUtils {

    private CacheKeyUtils() {
    }

    public static String accountListKey(AccountFilter request) {
        if (request == null) {
            return "null";
        }

        return request.getPage() + "|" + request.getSize() + "|" + request.getSortBy() + "|" + request.isAscending() + "|"
                + safe(request.getUsername()) + "|" + safe(request.getActive()) + "|" + safe(request.getLogin()) + "|" + safe(request.getRoleId());
    }

    public static String taskSearchKey(String status, String keyword, Long projectId, Long assignedAccountId, int page, int size) {
        return safe(status) + "|" + safe(keyword) + "|" + safe(projectId) + "|" + safe(assignedAccountId) + "|" + page + "|" + size;
    }

    public static String simpleKey(Object value) {
        return safe(value);
    }

    private static String safe(Object value) {
        return value == null ? "null" : value.toString();
    }
}