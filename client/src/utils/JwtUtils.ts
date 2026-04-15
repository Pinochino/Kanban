let accessToken: string | null = null;

const setAccessToken = (token: string | null) => {
    accessToken = token;
}

const getAccessToken = () => {
    return accessToken;
}

export { setAccessToken, getAccessToken }
