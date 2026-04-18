export interface IChatContact {
  id: number | string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  roleName?: string | null;
  unreadCount: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}

export interface IChatMessage {
  id: number | string;
  senderId: number | string;
  senderName: string;
  senderAvatarUrl?: string | null;
  receiverId: number | string;
  receiverName: string;
  receiverAvatarUrl?: string | null;
  groupId?: number | string | null;
  groupName?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface IChatGroup {
  id: number | string;
  name: string;
  description?: string | null;
  creatorId?: number | string | null;
  creatorName?: string | null;
  memberCount: number;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string | null;
}

export interface IPagedChatMessage {
  items: IChatMessage[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ISendChatMessageRequest {
  receiverId: number | string;
  content: string;
}

export interface ICreateChatGroupRequest {
  name: string;
  description?: string;
  memberIds: Array<number | string>;
}

export interface ISendChatGroupMessageRequest {
  content: string;
}
