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
        
        
    },

    projects: {
        list: "/projects/list",
        detail: "/projects/detail",
        create: "/projects/create",
    },

    tasks: {
        list: "/tasks/list",
        detail: "/tasks/detail",
        create: "/tasks/create",
        update: "/tasks/update",
        updateStatus: "/tasks/update-status",
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