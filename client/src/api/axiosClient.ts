import { getAccessToken, setAccessToken } from '@/utils/JwtUtils';
import axios from 'axios';

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9000/api').replace(/\/+$/, '');

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    withCredentials: true
});

// Add a request interceptor
axiosClient.interceptors.request.use(function (config) {
    // Do something before request is sent

    const token = getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
},
    { synchronous: true, runWhen: () => /* This function returns true */ true }
);

let isRefreshing: boolean = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
}

// Add a response interceptor
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = String(originalRequest?.url ?? "");
        const isAuthEndpoint = requestUrl.includes("/auth/login")
            || requestUrl.includes("/auth/register")
            || requestUrl.includes("/auth/refresh-token")
            || requestUrl.includes("/auth/logout");

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosClient(originalRequest);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // gọi API refresh (cookie tự gửi kèm)
                const res = await axios.post(`${apiBaseUrl}/auth/refresh-token`, {}, {
                    withCredentials: true
                });


                const newAccessToken = res.data.data;

                setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                setAccessToken(null);
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("auth:session-expired"));
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

