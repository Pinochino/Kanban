import { AxiosInterceptorOptions, AxiosRequestConfig } from "axios";
import axiosClient from "./axiosClient";

type apiMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";

interface IHandleApi extends AxiosRequestConfig {
    url: string;
    method: apiMethod;
    data: unknown
}

export const handleApi = ({ url, method = "GET", data, ...props }: IHandleApi) => {
    return axiosClient({
        url,
        method,
        data,
        ...props
    })
}