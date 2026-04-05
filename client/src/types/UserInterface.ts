export interface IUser {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    roles: IRole[];
}

export interface IRole {
    id: number;
    name: string
}

export type ILogin = Required<Pick<IUser, "email" | "password">>
export type IRegister = Required<Pick<IUser, "email" | "password">>