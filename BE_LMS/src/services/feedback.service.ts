import { FeedbackModel, UserModel } from "@/models";
import { Types } from "mongoose";
import { Role } from "@/types";
import { FeedbackType } from "@/types/feedback.type";
import IFeedback from "@/types/feedback.type";
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import { uploadFile, removeFile } from "@/utils/uploadFile";
import { CreateFeedbackInput, ListFeedbacksInput } from "@/validators/feedback.schemas";

/**
 * Prefix for feedback file uploads
 */
const getFeedbackFilePrefix = (feedbackId: string) => {
  return `feedbacks/${feedbackId}`;
};

/**
 * Create new feedback
 * - User can submit feedback about system, teacher, or other
 * - Optional file attachment (image, PDF, etc.)
 * - Validate targetId exists if provided
 */
export const createFeedback = async (
  data: CreateFeedbackInput,
  userId: Types.ObjectId,
  file?: Express.Multer.File
) => {
  // Validate user exists
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  // If targetId is provided and type is TEACHER, validate teacher exists
  if (data.targetId && data.type === FeedbackType.TEACHER) {
    const targetUser = await UserModel.findById(data.targetId);
    appAssert(targetUser, NOT_FOUND, "Target user not found");
    appAssert(
      targetUser.role === Role.TEACHER || targetUser.role === Role.ADMIN,
      BAD_REQUEST,
      "Target must be a teacher or admin"
    );
  }

  // Create feedback without file first
  const feedback: IFeedback = await FeedbackModel.create({
    ...data,
    userId,
  }) as IFeedback;

  // Upload file if provided
  if (file) {
    try {
      const prefix = getFeedbackFilePrefix(feedback._id.toString());
      const { publicUrl, key, originalName, mimeType, size } = await uploadFile(
        file,
        prefix
      );

      // Update feedback with file info
      feedback.originalName = originalName;
      feedback.mimeType = mimeType ? mimeType : undefined;
      feedback.key = key;
      feedback.size = size;
      await feedback.save();
    } catch (err) {
      // Rollback: delete feedback if file upload fails
      await FeedbackModel.findByIdAndDelete(feedback._id);
      throw err;
    }
  }

  // Populate user info
  await feedback.populate("userId", "username email fullname avatar_url");

  // Populate targetId if it's a teacher feedback
  if (feedback.targetId && feedback.type === FeedbackType.TEACHER) {
    await feedback.populate("targetId", "username email fullname avatar_url role");
  }

  return feedback;
};

/**
 * Get list of feedbacks with filters and pagination
 * - Admin: can see all feedbacks
 * - User: can only see their own feedbacks
 */
export const listFeedbacks = async (
  filters: ListFeedbacksInput,
  userId: Types.ObjectId,
  userRole: Role
) => {
  const {
    page,
    limit,
    type,
    targetId,
    userId: filterUserId,
    minRating,
    maxRating,
    from,
    to,
    sortBy,
    sortOrder,
  } = filters;

  // Build query
  const query: any = {};

  // Access control: non-admin can only see their own feedbacks
  if (userRole !== Role.ADMIN) {
    query.userId = userId;
  } else if (filterUserId) {
    // Admin can filter by userId
    query.userId = filterUserId;
  }

  // Apply filters
  if (type) {
    query.type = type;
  }

  if (targetId) {
    query.targetId = targetId;
  }

  if (minRating || maxRating) {
    query.rating = {};
    if (minRating) query.rating.$gte = minRating;
    if (maxRating) query.rating.$lte = maxRating;
  }

  // Filter by date range (validation handled by schema)
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sort
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query
  const promises: any[] = [
    FeedbackModel.find(query)
      .populate("userId", "username email fullname avatar_url")
      .populate("targetId", "username email fullname avatar_url role")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments(query),
  ];

  // If filtering by type or targetId, calculate average rating
  if (type || targetId) {
    const avgQuery: any = {};
    if (type) avgQuery.type = type;
    if (targetId) avgQuery.targetId = new Types.ObjectId(targetId);

    promises.push(
      FeedbackModel.aggregate([
        { $match: avgQuery },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ])
    );
  }

  const results = await Promise.all(promises);
  const feedbacks = results[0];
  const total = results[1];
  const stats = (type || targetId) ? results[2] : [];

  let averageRating = undefined;
  if ((type || targetId) && stats.length > 0) {
    averageRating = Math.round(stats[0].avgRating * 10) / 10;
  } else if (type || targetId) {
    averageRating = 0;
  }

  return {
    feedbacks,
    averageRating,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get feedback by ID
 * - Admin: can see any feedback
 * - User: can only see their own feedback
 */
export const getFeedbackById = async (
  feedbackId: string,
  userId: Types.ObjectId,
  userRole: Role
) => {
  const feedback = await FeedbackModel.findById(feedbackId)
    .populate("userId", "username email fullname avatar_url")
    .populate("targetId", "username email fullname avatar_url role")
    .lean();

  appAssert(feedback, NOT_FOUND, "Feedback not found");

  // Access control
  if (userRole !== Role.ADMIN) {
    appAssert(
      feedback.userId._id.equals(userId),
      FORBIDDEN,
      "You can only view your own feedbacks"
    );
  }

  return feedback;
};

/**
 * Get user's own feedbacks
 */
export const getMyFeedbacks = async (
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [feedbacks, total] = await Promise.all([
    FeedbackModel.find({ userId })
      .populate("targetId", "username email fullname avatar_url role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments({ userId }),
  ]);

  return {
    feedbacks,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get feedbacks about a specific target (teacher, course, etc.)
 * - Admin: can see all
 * - Teacher: can see feedbacks about themselves
 */
export const getFeedbacksByTarget = async (
  targetId: string,
  userId: Types.ObjectId,
  userRole: Role,
  page: number = 1,
  limit: number = 10
) => {
  // Access control: only admin can view feedbacks about a specific target
  appAssert(
    userRole === Role.ADMIN,
    FORBIDDEN,
    "Only administrators can view all feedbacks"
  );

  const skip = (page - 1) * limit;

  const [feedbacks, total, stats] = await Promise.all([
    FeedbackModel.find({ targetId })
      .populate("userId", "username email fullname avatar_url")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments({ targetId }),
    FeedbackModel.aggregate([
      { $match: { targetId: new Types.ObjectId(targetId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]),
  ]);

  // Calculate average rating
  const avgRating = stats.length > 0 ? stats[0].avgRating : 0;

  return {
    feedbacks,
    averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Delete feedback
 * - Admin: can delete any feedback
 * - User: can only delete their own feedback
 */
export const deleteFeedback = async (
  feedbackId: string,
  userId: Types.ObjectId,
  userRole: Role
) => {
  const feedback = await FeedbackModel.findById(feedbackId);
  appAssert(feedback, NOT_FOUND, "Feedback not found");

  // Access control
  if (userRole !== Role.ADMIN) {
    appAssert(
      (feedback.userId as Types.ObjectId).equals(userId),
      FORBIDDEN,
      "You can only delete your own feedbacks"
    );
  }

  // Delete file if exists
  if (feedback.key) {
    await removeFile(feedback.key).catch((err) => {
      console.error("⚠️ Failed to delete feedback file:", err);
      // Continue with feedback deletion even if file deletion fails
    });
  }

  await FeedbackModel.findByIdAndDelete(feedbackId);

  return {
    message: "Feedback deleted successfully",
  };
};

