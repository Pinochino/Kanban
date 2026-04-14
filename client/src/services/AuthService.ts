import { apiName } from "@/api/apiName";
import axiosClient from "@/api/axiosClient";
import { handleApi } from "@/api/handleApi";
import { createAppAsyncThunk } from "@/store/appThunk";
import { ILogin, IRegister } from "@/types/UserInterface";

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

        return res.data?.data?.account;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue("Unknown error");
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


        return res.data?.data?.account;
      } catch (error: unknown) {
        if (error instanceof Error) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue("Unknown error");
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
