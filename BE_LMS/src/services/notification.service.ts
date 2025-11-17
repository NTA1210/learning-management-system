import { NOT_FOUND, BAD_REQUEST, FORBIDDEN } from "../constants/http";
import NotificationModel from "../models/notification.model";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { EnrollmentStatus } from "../types/enrollment.type";
import { UserStatus } from "../types/user.type";
import {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "../validators/notification.schemas";

/**
 * Create a notification
 * - For "user": send to a specific user
 * - For "course": send to all enrolled students in a course
 * - For "all": send to all users (admin only)
 */
export const createNotification = async (
  data: CreateNotificationInput,
  senderId: string
) => {
  const { title, message, recipientType, recipientUser, recipientCourse } =
    data;

  // Validate recipient exists
  if (recipientType === "user" && recipientUser) {
    const user = await UserModel.findById(recipientUser);
    appAssert(user, NOT_FOUND, "Recipient user not found");
  }

  if (recipientType === "course" && recipientCourse) {
    const course = await CourseModel.findById(recipientCourse);
    appAssert(course, NOT_FOUND, "Recipient course not found");
  }

  // Create notifications based on recipient type
  if (recipientType === "user" && recipientUser) {
    // Single user notification
    const notification = await NotificationModel.create({
      title,
      message,
      sender: senderId,
      recipientUser,
      recipientType: "user",
      isRead: false,
    });
    return notification;
  } else if (recipientType === "course" && recipientCourse) {
    // Get all enrolled students in the course
    const enrollments = await EnrollmentModel.find({
      courseId: recipientCourse,
      status: EnrollmentStatus.APPROVED, // Only send to approved enrollments
    }).select("studentId");

    if (enrollments.length === 0) {
      return { message: "No enrolled students found in this course" };
    }

    // Create notification for each enrolled student
    const notifications = await Promise.all(
      enrollments.map((enrollment) =>
        NotificationModel.create({
          title,
          message,
          sender: senderId,
          recipientUser: enrollment.studentId,
          recipientCourse,
          recipientType: "course",
          isRead: false,
        })
      )
    );

    return {
      notifications,
      count: notifications.length,
    };
  } else if (recipientType === "all") {
    // Get all active users
    const users = await UserModel.find({
      isVerified: true,
      status: UserStatus.ACTIVE,
    }).select("_id");

    if (users.length === 0) {
      return { message: "No active users found" };
    }

    // Create notification for each user
    const notifications = await Promise.all(
      users.map((user) =>
        NotificationModel.create({
          title,
          message,
          sender: senderId,
          recipientUser: user._id,
          recipientType: "all",
          isRead: false,
        })
      )
    );

    return {
      notifications,
      count: notifications.length,
    };
  }

  throw new Error("Invalid recipient type");
};

/**
 * Get notifications for the current user
 * Supports pagination and filtering by read status and date range
 */
export const getNotifications = async (
  userId: string,
  query: ListNotificationsQuery
) => {
  const { page = 1, limit = 10, isRead, from, to } = query;
  const skip = (page - 1) * limit;

  const filter: any = {
    recipientUser: userId,
  };

  if (isRead !== undefined) {
    filter.isRead = isRead;
  }

  // Filter by date range (validation handled by schema)
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [notifications, total] = await Promise.all([
    NotificationModel.find(filter)
      .populate("sender", "username fullname avatar_url")
      .populate("recipientCourse", "title code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NotificationModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  const notification = await NotificationModel.findById(notificationId);
  appAssert(notification, NOT_FOUND, "Notification not found");

  // Check if user owns this notification
  appAssert(
    notification.recipientUser?.toString() === userId,
    FORBIDDEN,
    "You can only mark your own notifications as read"
  );

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Mark multiple notifications as read
 */
export const markNotificationsAsRead = async (
  notificationIds: string[],
  userId: string
) => {
  const notifications = await NotificationModel.find({
    _id: { $in: notificationIds },
    recipientUser: userId,
  });

  appAssert(
    notifications.length > 0,
    NOT_FOUND,
    "No notifications found or you don't have permission"
  );

  const now = new Date();
  await NotificationModel.updateMany(
    { _id: { $in: notificationIds }, recipientUser: userId },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    }
  );

  return {
    count: notifications.length,
    message: `Marked ${notifications.length} notification(s) as read`,
  };
};

/**
 * Mark all notifications as read for the current user
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await NotificationModel.updateMany(
    {
      recipientUser: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return {
    count: result.modifiedCount,
    message: `Marked ${result.modifiedCount} notification(s) as read`,
  };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  const notification = await NotificationModel.findById(notificationId);
  appAssert(notification, NOT_FOUND, "Notification not found");

  // Check if user owns this notification
  appAssert(
    notification.recipientUser?.toString() === userId,
    FORBIDDEN,
    "You can only delete your own notifications"
  );

  await NotificationModel.findByIdAndDelete(notificationId);
  return { message: "Notification deleted successfully" };
};

/**
 * Get unread notification count for the current user
 */
export const getUnreadNotificationCount = async (userId: string) => {
  const count = await NotificationModel.countDocuments({
    recipientUser: userId,
    isRead: false,
  });

  return { count };
};

