import { FeedbackModel, UserModel } from "@/models";
import { Role } from "@/types";
import { FeedbackType } from "@/types/feedback.type";
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
  userId: string,
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
  const feedback = await FeedbackModel.create({
    ...data,
    userId,
  });

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
      feedback.mimeType = mimeType;
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
  userId: string,
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

  // Pagination
  const skip = (page - 1) * limit;

  // Sort
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query
  const [feedbacks, total] = await Promise.all([
    FeedbackModel.find(query)
      .populate("userId", "username email fullname avatar_url")
      .populate("targetId", "username email fullname avatar_url role")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments(query),
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
 * Get feedback by ID
 * - Admin: can see any feedback
 * - User: can only see their own feedback
 */
export const getFeedbackById = async (
  feedbackId: string,
  userId: string,
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
      feedback.userId._id.toString() === userId,
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
  userId: string,
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
  userId: string,
  userRole: Role,
  page: number = 1,
  limit: number = 10
) => {
  // Access control: only admin or the target user can view
  if (userRole !== Role.ADMIN && targetId !== userId) {
    appAssert(false, FORBIDDEN, "You can only view feedbacks about yourself");
  }

  const skip = (page - 1) * limit;

  const [feedbacks, total] = await Promise.all([
    FeedbackModel.find({ targetId })
      .populate("userId", "username email fullname avatar_url")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedbackModel.countDocuments({ targetId }),
  ]);

  // Calculate average rating
  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

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
  userId: string,
  userRole: Role
) => {
  const feedback = await FeedbackModel.findById(feedbackId);
  appAssert(feedback, NOT_FOUND, "Feedback not found");

  // Access control
  if (userRole !== Role.ADMIN) {
    appAssert(
      feedback.userId.toString() === userId,
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

