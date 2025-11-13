import { z } from "zod";
import { FeedbackType } from "@/types/feedback.type";

// ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Schema for creating feedback
 * File attachment is optional and handled by multer
 */
export const createFeedbackSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be less than 2000 characters"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  targetId: z
    .string()
    .regex(objectIdRegex, "Invalid target ID format")
    .optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

/**
 * Schema for listing feedbacks with filters
 */
export const listFeedbacksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.nativeEnum(FeedbackType).optional(),
  targetId: z.string().regex(objectIdRegex).optional(),
  userId: z.string().regex(objectIdRegex).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(["createdAt", "rating"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListFeedbacksInput = z.infer<typeof listFeedbacksSchema>;

/**
 * Schema for feedback ID parameter
 */
export const feedbackIdSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid feedback ID format"),
});

/**
 * Schema for targetId parameter
 */
export const targetIdSchema = z.object({
  targetId: z.string().regex(objectIdRegex, "Invalid target ID format"),
});

