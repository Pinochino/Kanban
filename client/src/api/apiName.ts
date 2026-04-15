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
        create: "/projects/create",
    },

    roles: {
        list: "/roles/list",

    }
}