import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { resetAuthState } from "@/store/slice/AuthSlice";
import { getAccessToken, setAccessToken } from "@/utils/JwtUtils";

interface IAuthProvider {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: IAuthProvider) => {
    const dispatch = useAppDispatch();
    const { data: userLogin, status: statusLogin } = useAppSelector((state: RootState) => state.auth.login)
    const { data: userRegister, status: statusRegister } = useAppSelector((state: RootState) => state.auth.register)
    const [isRestoringSession, setIsRestoringSession] = useState(false);

    const hasUser = useMemo(
        () => userLogin !== null || userRegister !== null,
        [userLogin, userRegister],
    );

    useEffect(() => {
        const onSessionExpired = () => {
            setAccessToken(null);
            dispatch(resetAuthState());
        };

        window.addEventListener("auth:session-expired", onSessionExpired);
        return () => {
            window.removeEventListener("auth:session-expired", onSessionExpired);
        };
    }, [dispatch]);

    useEffect(() => {
        if (!hasUser || getAccessToken()) {
            return;
        }

        let isActive = true;
        setIsRestoringSession(true);

        const restoreSession = async () => {
            try {
                const res = await axios.post("http://localhost:9000/api/auth/refresh-token", {}, {
                    withCredentials: true,
                });

                const newAccessToken = res.data?.data;

                if (!newAccessToken) {
                    throw new Error("Missing access token");
                }

                if (isActive) {
                    setAccessToken(newAccessToken);
                }
            } catch {
                if (isActive) {
                    setAccessToken(null);
                    dispatch(resetAuthState());
                }
            } finally {
                if (isActive) {
                    setIsRestoringSession(false);
                }
            }
        };

        void restoreSession();

        return () => {
            isActive = false;
        };
    }, [dispatch, hasUser]);

    if (statusLogin === "pending" || statusRegister === "pending" || isRestoringSession) {
        return <div>Loading...</div>;
    }

    return !hasUser ? (
        <Navigate to={"/auth"} replace />
    ) : (
        <div>{children}</div>
    );
};
