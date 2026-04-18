import { apiName } from "@/api/apiName";
import axiosClient from "@/api/axiosClient";
import { handleApi } from "@/api/handleApi";
import { createAppAsyncThunk } from "@/store/appThunk";
import { ILogin, IRegister } from "@/types/UserInterface";
import { setAccessToken } from "@/utils/JwtUtils";
import { AxiosError } from "axios";

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as { message?: string } | undefined;
    const message = responseData?.message ?? error.message ?? fallback;
    const normalized = message.toLowerCase();

    if (normalized.includes("refresh token is required")) {
      return fallback;
    }

    return message;
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("refresh token is required")) {
      return fallback;
    }
    return error.message;
  }

  return fallback;
};

const authService = {
  login: createAppAsyncThunk(
    apiName.auth.login,
    async (data, { rejectWithValue }) => {
      try {
        const res = await handleApi({
          url: apiName.auth.login,
          method: "POST",
          data,
          withCredentials: true,
        });

        if (res.status < 200 || res.status >= 300) {
          return rejectWithValue(res.statusText);
        }

        setAccessToken(res.data?.data?.accessToken ?? null);

        return res.data?.data?.account;
      } catch (error: unknown) {
        return rejectWithValue(extractApiErrorMessage(error, "Đăng nhập thất bại"));
      }
    },
  ),

  register: createAppAsyncThunk(
    apiName.auth.register,
    async (data, { rejectWithValue }) => {
      try {
        const res = await handleApi({
          url: apiName.auth.register,
          method: "POST",
          data,
          withCredentials: true,
        });

        if (res.status < 200 || res.status >= 300) {
          return rejectWithValue(res.statusText);
        }

        setAccessToken(res.data?.data?.accessToken ?? null);

        return res.data?.data?.account;
      } catch (error: unknown) {
        return rejectWithValue(extractApiErrorMessage(error, "Đăng ký thất bại"));
      }
    },
  ),

  logout: createAppAsyncThunk(
    apiName.auth.logout,
    async (_, { rejectWithValue }) => {


      try {
        const res = await axiosClient.post(apiName.auth.logout, _, {
          withCredentials: true
        })

        if (res.status < 200 || res.status >= 300) {
          return rejectWithValue(res.statusText);
        }

        setAccessToken(null);

        return res.data;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue("Unknown error");
      }
    },
  ),



};

export default authService;
