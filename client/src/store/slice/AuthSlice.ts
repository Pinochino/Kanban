import { IUser } from "@/types/UserInterface";
import { createGenericSlice, GenericState } from "./BaseSlice";
import authService from "@/services/AuthService";
import { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    login: GenericState<IUser>;
    register: GenericState<IUser>;
    logout: GenericState<IUser>;
}

const initialState: AuthState = {
    login: {
        status: "idle",
        data: null,
        error: null,
    },
    register: {
        status: "idle",
        data: null,
        error: null,
    },
    logout: {
        status: "idle",
        data: null,
        error: null,
    },
};

const authSlice = createGenericSlice({
    name: "auth",
    initialState: initialState,
    reducers: {
        resetAuthState: (state) => {
            state.login = {
                status: "idle",
                data: null,
                error: null,
            };
            state.register = {
                status: "idle",
                data: null,
                error: null,
            };
            state.logout = {
                status: "idle",
                data: null,
                error: null,
            };
        },
        setCurrentUser: (state, action: PayloadAction<IUser>) => {
            if (state.login.data) {
                state.login.data = action.payload;
                return;
            }

            if (state.register.data) {
                state.register.data = action.payload;
                return;
            }

            state.login.data = action.payload;
            state.login.status = "succeeded";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(authService.login.pending, (state) => {
                state.login.status = "pending";
            })
            .addCase(authService.login.fulfilled, (state, action) => {
                state.login.status = "succeeded";
                state.login.data = action.payload;
            })
            .addCase(authService.login.rejected, (state, action) => {
                state.login.status = "failed";
                state.login.error = action.error.message;
            })

            .addCase(authService.register.pending, (state) => {
                state.register.status = "pending";
            })
            .addCase(authService.register.fulfilled, (state, action) => {
                state.register.status = "succeeded";
                state.register.data = action.payload;
            })
            .addCase(authService.register.rejected, (state, action) => {
                state.register.status = "failed";
                state.register.error = action.error.message;
            })

            .addCase(authService.logout.pending, (state) => {
                state.logout.status = "pending";
            })
            .addCase(authService.logout.fulfilled, (state, action) => {
                state.logout.status = "succeeded";
                state.login.data = null;
                state.register.data = null;
            })
            .addCase(authService.logout.rejected, (state, action) => {
                state.logout.status = "failed";
                state.logout.error = action.error.message;
            })
    },
});

export const { resetAuthState, setCurrentUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
