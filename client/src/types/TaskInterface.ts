export interface ICreateTask {
    projectId: string;
    title: string,
    description: string,
    dueDate: string,
    reminderDate: string,
    assignedAccountId: string,
    listTaskId: string
}