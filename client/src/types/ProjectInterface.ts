export interface IProject {
    id: number | string;
    title: string;
    description: string;
    createdBy: ICreatedBy
}

export interface ICreatedBy {
    id: number | string;
    username: string
}

export interface ICreateProject {
    title: string,
    description: string | null,
    isPublic: string ,
    assignAccountId: number | string
}