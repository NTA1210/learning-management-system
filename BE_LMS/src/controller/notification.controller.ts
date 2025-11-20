import { catchErrors } from "../utils/asyncHandler";
import { OK, CREATED } from "../constants/http";
import {
  createNotificationSchema,
  listNotificationsSchema,
  notificationIdSchema,
  markReadNotificationSchema,
} from "../validators/notification.schemas";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  undoDeleteNotification,
  hardDeleteNotification,
} from "../services/notification.service";
import { Role } from "../types";

/**
 * POST /notifications - Create a notification
 * - Admin can create notifications for all users
 * - Teachers can create notifications for their courses
 * - Users can create notifications for specific users (if allowed)
 */
export const createNotificationHandler = catchErrors(async (req, res) => {
  const data = createNotificationSchema.parse(req.body);
  const senderId = (req as any).userId;

  const result = await createNotification(data, senderId, req.role!);

  return res.success(CREATED, {
    data: result,
    message: "Notification(s) created successfully",
  });
});

/**
 * GET /notifications - Get notifications for the current user
 * Supports pagination and filtering by read status
 */
export const getNotificationsHandler = catchErrors(async (req, res) => {
  const query = listNotificationsSchema.parse(req.query);
  const userId = (req as any).userId;

  const result = await getNotifications(userId, query);

  return res.success(OK, {
    data: result.notifications,
    message: "Notifications retrieved successfully",
    pagination: result.pagination,
  });
});

/**
 * GET /notifications/unread-count - Get unread notification count
 */
export const getUnreadCountHandler = catchErrors(async (req, res) => {
  const userId = (req as any).userId;
  const result = await getUnreadNotificationCount(userId);

  return res.success(OK, {
    data: result,
    message: "Unread count retrieved successfully",
  });
});

/**
 * PUT /notifications/:id/read - Mark a single notification as read
 */
export const markNotificationAsReadHandler = catchErrors(async (req, res) => {
  const notificationId = notificationIdSchema.parse(req.params.id);
  const userId = (req as any).userId;

  const notification = await markNotificationAsRead(notificationId, userId);

  return res.success(OK, {
    data: notification,
    message: "Notification marked as read",
  });
});

/**
 * PUT /notifications/read - Mark multiple notifications as read
 */
export const markNotificationsAsReadHandler = catchErrors(async (req, res) => {
  const data = markReadNotificationSchema.parse(req.body);
  const userId = (req as any).userId;

  const result = await markNotificationsAsRead(data.notificationIds, userId);

  return res.success(OK, {
    data: result,
    message: result.message,
  });
});

/**
 * PUT /notifications/read-all - Mark all notifications as read for the current user
 */
export const markAllNotificationsAsReadHandler = catchErrors(
  async (req, res) => {
    const userId = (req as any).userId;

    const result = await markAllNotificationsAsRead(userId);

    return res.success(OK, {
      data: result,
      message: result.message,
    });
  }
);

/**
 * DELETE /notifications/:id - Delete a notification
 */
export const deleteNotificationHandler = catchErrors(async (req, res) => {
  const notificationId = notificationIdSchema.parse(req.params.id);
  const userId = (req as any).userId;

  const result = await deleteNotification(notificationId, userId);

  return res.success(OK, {
    data: result,
    message: result.message,
  });
});

/**
 * PUT /notifications/:id/undo-delete - Undo delete a notification
 */
export const undoDeleteNotificationHandler = catchErrors(async (req, res) => {
  const notificationId = notificationIdSchema.parse(req.params.id);
  const userId = (req as any).userId;

  const result = await undoDeleteNotification(notificationId, userId);

  return res.success(OK, {
    data: result,
    message: result.message,
  });
});

/**
 * DELETE /notifications/:id/hard - Permanently delete a notification
 */
export const hardDeleteNotificationHandler = catchErrors(async (req, res) => {
  const notificationId = notificationIdSchema.parse(req.params.id);
  const userId = (req as any).userId;

  const result = await hardDeleteNotification(notificationId, userId);

  return res.success(OK, {
    data: result,
    message: result.message,
  });
});

