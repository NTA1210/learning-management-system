import http from "../utils/http";
import type {
  NotificationItem,
  NotificationListResponse,
} from "../types/notification";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

const getNotifications = async (options?: {
  page?: number;
  limit?: number;
}): Promise<NotificationListResponse> => {
  const query = buildQuery({
    page: options?.page ?? 1,
    limit: options?.limit ?? 10,
  });
  const response = await http.get<NotificationListResponse>(
    `/notifications${query}`
  );
  return response;
};

const markNotificationAsRead = async (notificationId: string) => {
  await http.put(`/notifications/${notificationId}/read`);
};

const markNotificationsAsRead = async (notificationIds: string[]) => {
  if (!notificationIds.length) return;
  await http.put(`/notifications/read`, { notificationIds });
};

const markAllNotificationsAsRead = async () => {
  await http.put(`/notifications/read-all`);
};

const deleteNotification = async (notificationId: string) => {
  await http.del(`/notifications/${notificationId}`);
};

const deleteNotifications = async (notificationIds: string[]) => {
  await Promise.all(notificationIds.map(deleteNotification));
};

export const notificationService = {
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteNotifications,
};

export type { NotificationItem, NotificationListResponse };

