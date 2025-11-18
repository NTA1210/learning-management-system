import { Router } from "express";
import {
  createNotificationHandler,
  getNotificationsHandler,
  getUnreadCountHandler,
  markNotificationAsReadHandler,
  markNotificationsAsReadHandler,
  markAllNotificationsAsReadHandler,
  deleteNotificationHandler,
  undoDeleteNotificationHandler,
  hardDeleteNotificationHandler,
} from "../controller/notification.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const notificationRoutes = Router();

// prefix: /notifications

// GET /notifications - Get notifications for the current user
notificationRoutes.get("/", getNotificationsHandler);

// GET /notifications/unread-count - Get unread notification count
notificationRoutes.get("/unread-count", getUnreadCountHandler);

// POST /notifications - Create a notification (Admin/Teacher only)
notificationRoutes.post(
  "/",
  authorize(Role.ADMIN, Role.TEACHER),
  createNotificationHandler
);

// PUT /notifications/:id/read - Mark a single notification as read
notificationRoutes.put("/:id/read", markNotificationAsReadHandler);

// PUT /notifications/read - Mark multiple notifications as read
notificationRoutes.put("/read", markNotificationsAsReadHandler);

// PUT /notifications/read-all - Mark all notifications as read
notificationRoutes.put("/read-all", markAllNotificationsAsReadHandler);

// PUT /notifications/:id/undo-delete - Undo delete a notification
notificationRoutes.put("/:id/undo-delete", undoDeleteNotificationHandler);

// DELETE /notifications/:id/hard - Hard delete a notification
notificationRoutes.delete("/:id/hard", hardDeleteNotificationHandler);

// DELETE /notifications/:id - Delete a notification
notificationRoutes.delete("/:id", deleteNotificationHandler);

export default notificationRoutes;

