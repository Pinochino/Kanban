import React from "react";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";

interface IAuthProvider {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: IAuthProvider) => {
    const { data: userLogin, status: statusLogin } = useAppSelector((state: RootState) => state.auth.login)
    const { data: userRegister, status: statusRegister } = useAppSelector((state: RootState) => state.auth.register)

    if (statusLogin === "pending" || statusRegister === "pending") return <div>Loading...</div>;

    console.log("user_register: ", userRegister)
    

    return userLogin === null && userRegister === null ? (
        <Navigate to={"/auth"} replace />
    ) : (
        <div>{children}</div>
    );
};
