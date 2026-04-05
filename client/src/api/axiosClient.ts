import { getAccessToken, setAccessToken } from '@/utils/JwtUtils';
import axios from 'axios';
import { error } from 'console';

const axiosClient = axios.create({
    baseURL: 'http://localhost:9000/api',
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

        if (error.response?.status === 401 && !originalRequest._retry) {
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
                const res = await axios.post("http://localhost:9000/api/auth/refresh-token", {}, {
                    withCredentials: true
                });


                const newAccessToken = res.data.accessToken;


                setAccessToken(newAccessToken);

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

