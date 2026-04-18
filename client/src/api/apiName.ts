export const apiName = {
    auth: {
        login: "/auth/login",
        register: "/auth/register",
        logout: "/auth/logout",



    },

    accounts: {
        list: "/accounts/list",
        detail: '/accounts/detail',
        activeNums: "/accounts/count-active",
        loginNums: "/accounts/count-login",
        countByRole: "/accounts/count-by-role",
        count: "/accounts/count",
        listSoftDelete: "/accounts/soft-delete/list",
        update: '/accounts/update',
        updateProfile: '/accounts/update-profile',
        
        
    },

    projects: {
        list: "/projects/list",
        detail: "/projects/detail",
        create: "/projects/create",
    },

    tasks: {
        list: "/tasks/list",
        search: "/tasks/search",
        detail: "/tasks/detail",
        create: "/tasks/create",
        update: "/tasks/update",
        updateStatus: "/tasks/update-status",
    },

    dashboard: {
        stats: "/dashboard/stats",
    },

    notifications: {
        adminCreate: "/notifications/admin/create",
        adminList: "/notifications/admin/list",
        myList: "/notifications/my/list",
        markRead: "/notifications",
        retry: "/notifications/admin/retry",
    },

    chats: {
        contacts: "/chats/contacts",
        conversation: "/chats/conversation",
        send: "/chats/send",
        groups: "/chats/groups",
        groupConversation: "/chats/groups",
        groupSend: "/chats/groups",
    },

    labels: {
        list: "/labels/list",
        create: "/labels/create",
    },

    comments: {
        list: "/comments/list",
        create: "/comments/create",
    },

    taskLabels: {
        list: "/task-labels/list",
        toggle: "/task-labels/toggle",
    },

    roles: {
        list: "/roles/list",

    }
}