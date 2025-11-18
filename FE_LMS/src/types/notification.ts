export interface NotificationSender {
  _id: string;
  username: string;
  avatarUrl?: string;
  fullname?: string;
  fullName?: string;
}

export type RecipientType = "all" | "user" | "course";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  sender?: NotificationSender;
  recipientUser?: string;
  recipientType: RecipientType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NotificationMeta {
  timestamp: string;
  timezone: string;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
  pagination: NotificationPagination;
  meta?: NotificationMeta;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  recipientType: RecipientType;
  recipientUser?: string;
  recipientCourse?: string;
}

