export type NotificationChannel = "WEB" | "EMAIL";
export type NotificationStatus = "SENT" | "FAILED" | "PENDING";
export type NotificationType = "TASK_ASSIGNED" | "ADMIN_MESSAGE" | "TASK_DUE" | "TASK_REMINDER";

export interface INotification {
  id: number;
  recipientId: number | null;
  recipientName: string | null;
  recipientEmail: string | null;
  taskId: number | null;
  channel: NotificationChannel;
  type: NotificationType | string;
  status: NotificationStatus;
  isRead: boolean;
  retryCount: number;
  title: string;
  message: string;
  createdAt: string;
  scheduledAt?: string | null;
  deliveredAt?: string | null;
}

export interface IAdminCreateNotificationRequest {
  recipientAccountId: number;
  title: string;
  message: string;
  channels: NotificationChannel[];
  scheduledAt?: string;
}
