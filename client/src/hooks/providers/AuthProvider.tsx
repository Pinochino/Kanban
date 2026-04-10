import React from "react";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";

interface IAuthProvider {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: IAuthProvider) => {
    const { data: userLogin, status } = useAppSelector((state: RootState) => state.auth.login)

    if (status === "pending") return <div>Loading...</div>;

    console.log("user_login: ", userLogin?.roles[0].name)

    

    return userLogin == null ? (
        <Navigate to={"/auth"} replace />
    ) : (
        <div>{children}</div>
    );
};
