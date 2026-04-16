export interface IProject {
    id: number | string;
    title: string;
    description: string;
    createdBy: ICreatedBy;
    isPublic?: boolean;
    listTasks?: IListTask[];
}

export interface ICreatedBy {
    id: number | string;
    username: string
}

export interface IListTask {
    id: number | string;
    status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "todo" | "in_progress" | "review" | "done";
    orderIndex?: number;
    taskList?: ITask[];
}

export interface ITask {
    id: number | string;
    title: string;
    description?: string;
    orderIndex?: number;
    projectId?: number | string;
    listTaskId?: number | string;
    listTaskStatus?: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    assignedAccount?: ICreatedBy;
    isActive?: boolean;
    dueDate?: string;
    reminderDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ICreateProject {
    title: string,
    description: string | null,
    isPublic: string ,
    assignAccountId: number | string
}