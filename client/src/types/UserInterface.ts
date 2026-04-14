export interface IUser {
    id?: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    login?: boolean;
    active?: boolean;
    roles: IRole[];
    deleted?: boolean;
}

export interface IRole {
    id: number;
    name: string
}

export type ILogin = Required<Pick<IUser, "email" | "password">>
export type IRegister = Required<Pick<IUser, "email" | "password">>