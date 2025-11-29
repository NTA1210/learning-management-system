import { NOT_FOUND, BAD_REQUEST, FORBIDDEN } from "../constants/http";
import { Types } from "mongoose";
import NotificationModel from "../models/notification.model";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import AnnouncementModel from "../models/announcement.model";
import appAssert from "../utils/appAssert";
import { EnrollmentStatus } from "../types/enrollment.type";
import { UserStatus } from "../types/user.type";
import { Role } from "../types";
import {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "../validators/notification.schemas";

/**
 * Create a notification
 * - For "user": send to a specific user (from another user)
 * - For "system": send to a specific user (from system)
 */
export const createNotification = async (
  data: CreateNotificationInput,
  senderId: Types.ObjectId,
  senderRole: Role
) => {
  const { title, message, recipientType, recipientUser, recipientCourse } = data;

  // Validate recipient exists
  if (!recipientUser) {
    throw new Error("recipientUser is required");
  }

  const user = await UserModel.findById(recipientUser);
  appAssert(user, NOT_FOUND, "Recipient user not found");

  // Validate recipientCourse if provided
  if (recipientCourse) {
    const course = await CourseModel.findById(recipientCourse);
    appAssert(course, NOT_FOUND, "Course not found");
  }

  // For "user" type: validate sender permissions
  if (recipientType === "user") {
    // Teacher can only send to students in their courses
    if (senderRole === Role.TEACHER) {
      const teacherCourses = await CourseModel.find({
        teacherIds: senderId,
      }).select("_id");

      const teacherCourseObjectIds = teacherCourses.map(
        (course) => course._id as Types.ObjectId
      );

      appAssert(
        teacherCourseObjectIds.length > 0,
        FORBIDDEN,
        "You are not assigned to any courses"
      );

      // If a specific course is specified, check if teacher owns it and student is enrolled in it
      if (recipientCourse) {
        const isTeacherOfCourse = teacherCourseObjectIds.some((id) =>
          id.equals(recipientCourse)
        );
        appAssert(
          isTeacherOfCourse,
          FORBIDDEN,
          "You are not a teacher of this course"
        );

        const enrollment = await EnrollmentModel.exists({
          studentId: recipientUser,
          status: EnrollmentStatus.APPROVED,
          courseId: recipientCourse,
        });

        appAssert(
          enrollment,
          FORBIDDEN,
          "Student is not enrolled in this course"
        );
      } else {
        // General message: check if student is enrolled in ANY of teacher's courses
        const enrollment = await EnrollmentModel.exists({
          studentId: recipientUser,
          status: EnrollmentStatus.APPROVED,
          courseId: { $in: teacherCourseObjectIds },
        });

        appAssert(
          enrollment,
          FORBIDDEN,
          "You can only message students enrolled in your courses"
        );
      }
    }

    // Create notification with sender
    const notification = await NotificationModel.create({
      title,
      message,
      sender: senderId,
      recipientUser,
      recipientCourse,
      recipientType: "user",
      isRead: false,
    });

    return notification;
  } else if (recipientType === "system") {
    // For "system" type: no sender, no permission check
    const notification = await NotificationModel.create({
      title,
      message,
      recipientUser,
      recipientType: "system",
      isRead: false,
    });

    return notification;
  }

  throw new Error("Invalid recipient type");
};

/**
 * Get notifications for the current user
 * Supports pagination and filtering by read status and date range
 * Includes both notifications and announcements (from enrolled courses + system announcements)
 */
export const getNotifications = async (
  userId: Types.ObjectId,
  query: ListNotificationsQuery
) => {
  const { page = 1, limit = 10, isRead, from, to } = query;

  // Build notification filter
  const notificationFilter: any = {
    recipientUser: userId,
    isDeleted: false,
  };

  if (isRead !== undefined) {
    notificationFilter.isRead = isRead;
  }

  // Filter by date range
  if (from || to) {
    notificationFilter.createdAt = {};
    if (from) notificationFilter.createdAt.$gte = from;
    if (to) notificationFilter.createdAt.$lte = to;
  }

  // Get user's enrolled courses (approved only)
  const enrollments = await EnrollmentModel.find({
    studentId: userId,
    status: EnrollmentStatus.APPROVED,
  }).select("courseId");

  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  // Build announcement filter
  const announcementFilter: any = {
    $or: [
      { courseId: { $in: enrolledCourseIds } }, // Course announcements
      { courseId: { $exists: false } }, // System announcements (no courseId)
      { courseId: null }, // System announcements (null courseId)
    ],
  };

  // Apply date range filter to announcements
  if (from || to) {
    announcementFilter.publishedAt = {};
    if (from) announcementFilter.publishedAt.$gte = from;
    if (to) announcementFilter.publishedAt.$lte = to;
  }

  // Fetch notifications and announcements in parallel
  const [notifications, announcements] = await Promise.all([
    NotificationModel.find(notificationFilter)
      .populate("sender", "username fullname avatar_url")
      .populate("recipientCourse", "title")
      .lean(),
    AnnouncementModel.find(announcementFilter)
      .populate("authorId", "username fullname avatar_url")
      .populate("courseId", "title")
      .lean(),
  ]);

  // Transform notifications to include type
  const transformedNotifications = notifications.map((notif: any) => ({
    ...notif,
    type: "notification",
    message: notif.message,
    createdAt: notif.createdAt,
  }));

  // Transform announcements to match notification structure
  const transformedAnnouncements = announcements.map((announcement: any) => ({
    _id: announcement._id,
    type: "announcement",
    title: announcement.title,
    message: announcement.content,
    sender: announcement.authorId,
    recipientCourse: announcement.courseId,
    createdAt: announcement.publishedAt || announcement.createdAt,
    isRead: false, // Announcements don't have read status
    readAt: null,
    isDeleted: false,
  }));

  // Merge and sort by createdAt descending
  const merged = [...transformedNotifications, ...transformedAnnouncements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply pagination to merged results
  const total = merged.length;
  const paginatedResults = merged.slice((page - 1) * limit, page * limit);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    notifications: paginatedResults,
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
  userId: Types.ObjectId
) => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    recipientUser: userId,
    isDeleted: false,
  });
  appAssert(notification, NOT_FOUND, "Notification not found");

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
  userId: Types.ObjectId
) => {
  const notifications = await NotificationModel.find({
    _id: { $in: notificationIds },
    recipientUser: userId,
    isDeleted: false,
  });

  appAssert(
    notifications.length > 0,
    NOT_FOUND,
    "No notifications found or you don't have permission"
  );

  const now = new Date();
  await NotificationModel.updateMany(
    { _id: { $in: notificationIds }, recipientUser: userId, isDeleted: false },
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
export const markAllNotificationsAsRead = async (userId: Types.ObjectId) => {
  const result = await NotificationModel.updateMany(
    {
      recipientUser: userId,
      isRead: false,
      isDeleted: false,
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
  userId: Types.ObjectId
) => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    recipientUser: userId,
    isDeleted: false,
  });

  appAssert(notification, NOT_FOUND, "Notification not found");

  notification.isDeleted = true;
  notification.deletedAt = new Date();
  await notification.save();

  return {
    deleted: true,
    message: "Notification deleted successfully",
  };
};

/**
 * Hard delete a notification (cannot be undone)
 */
export const hardDeleteNotification = async (
  notificationId: string,
  userId: Types.ObjectId
) => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    recipientUser: userId,
  });

  appAssert(notification, NOT_FOUND, "Notification not found");

  await NotificationModel.deleteOne({
    _id: notificationId,
    recipientUser: userId,
  });

  return {
    deleted: true,
    message: "Notification permanently deleted",
  };
};

/**
 * Get unread notification count for the current user
 */
export const getUnreadNotificationCount = async (userId: Types.ObjectId) => {
  const count = await NotificationModel.countDocuments({
    recipientUser: userId,
    isRead: false,
    isDeleted: false,
  });

  return { count };
};

/**
 * Undo soft delete for a notification
 */
export const undoDeleteNotification = async (
  notificationId: string,
  userId: Types.ObjectId
) => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    recipientUser: userId,
    isDeleted: true,
  });

  appAssert(
    notification,
    NOT_FOUND,
    "Notification not found or not deleted"
  );

  // Optional: limit undo time window (e.g. 5 minutes)
  const MAX_UNDO_MS = 5 * 60 * 1000;
  if (notification.deletedAt) {
    const diff = Date.now() - notification.deletedAt.getTime();
    appAssert(
      diff <= MAX_UNDO_MS,
      BAD_REQUEST,
      "Undo period has expired"
    );
  }

  notification.isDeleted = false;
  notification.deletedAt = undefined;
  await notification.save();

  return {
    restored: true,
    notification,
    message: "Notification restored successfully",
  };
};

