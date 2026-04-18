const ACCESS_TOKEN_STORAGE_KEY = "kanban:access-token";

let accessToken: string | null = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

const setAccessToken = (token: string | null) => {
    accessToken = token;

    if (token) {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
        return;
    }

    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

const getAccessToken = () => {
    if (!accessToken) {
        accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    }

    return accessToken;
}

export { setAccessToken, getAccessToken }
