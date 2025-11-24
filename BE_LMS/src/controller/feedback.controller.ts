import { catchErrors } from "@/utils/asyncHandler";
import { OK, CREATED } from "@/constants/http";
import {
  createFeedbackSchema,
  listFeedbacksSchema,
  feedbackIdSchema,
  targetIdSchema,
} from "@/validators/feedback.schemas";
import {
  createFeedback,
  listFeedbacks,
  getFeedbackById,
  getMyFeedbacks,
  getFeedbacksByTarget,
  deleteFeedback,
} from "@/services/feedback.service";
import { parseFormData } from "@/utils/parseFormData";

/**
 * POST /feedbacks - Create new feedback
 * - User can submit feedback with optional file attachment
 * - File handled by multer middleware
 */
export const createFeedbackHandler = catchErrors(async (req, res) => {
  // Get file from multer (if uploaded)
  const file = req.file;

  // Parse form-data fields
  const parsedBody = parseFormData(req.body);

  // Validate request body
  const data = createFeedbackSchema.parse(parsedBody);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service
  const feedback = await createFeedback(data, userId, file);

  return res.success(CREATED, {
    data: feedback,
    message: "Feedback submitted successfully",
  });
});

/**
 * GET /feedbacks - List all feedbacks with filters
 * - Admin: can see all feedbacks
 * - User: can only see their own feedbacks
 */
export const listFeedbacksHandler = catchErrors(async (req, res) => {
  // Validate query parameters
  const filters = listFeedbacksSchema.parse(req.query);

  // Get user info from authenticate middleware
  const userId = (req as any).userId;
  const userRole = req.role;

  // Call service
  const result = await listFeedbacks(filters, userId, userRole);

  return res.success(OK, {
    data: result.feedbacks,
    message: "Feedbacks retrieved successfully",
    averageRating: result.averageRating,
    pagination: result.pagination,
  });
});

/**
 * GET /feedbacks/:id - Get feedback by ID
 * - Admin: can view any feedback
 * - User: can only view their own feedback
 */
export const getFeedbackByIdHandler = catchErrors(async (req, res) => {
  // Validate feedback ID
  const { id } = feedbackIdSchema.parse(req.params);

  // Get user info from authenticate middleware
  const userId = (req as any).userId;
  const userRole = req.role;

  // Call service
  const feedback = await getFeedbackById(id, userId, userRole);

  return res.success(OK, {
    data: feedback,
    message: "Feedback retrieved successfully",
  });
});

/**
 * GET /feedbacks/my-feedbacks - Get current user's feedbacks
 */
export const getMyFeedbacksHandler = catchErrors(async (req, res) => {
  // Get user info from authenticate middleware
  const userId = (req as any).userId;

  // Parse pagination from query
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  // Call service
  const result = await getMyFeedbacks(userId, page, limit);

  return res.success(OK, {
    data: result.feedbacks,
    message: "Your feedbacks retrieved successfully",
    pagination: result.pagination,
  });
});

/**
 * GET /feedbacks/target/:targetId - Get feedbacks about a specific target
 * - Admin: can view all
 * - Teacher: can view feedbacks about themselves
 */
export const getFeedbacksByTargetHandler = catchErrors(async (req, res) => {
  // Validate target ID
  const { targetId } = targetIdSchema.parse(req.params);

  // Get user info from authenticate middleware
  const userId = (req as any).userId;
  const userRole = req.role;

  // Parse pagination from query
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  // Call service
  const result = await getFeedbacksByTarget(targetId, userId, userRole, page, limit);

  return res.success(OK, {
    data: result.feedbacks,
    message: "Target feedbacks retrieved successfully",
    averageRating: result.averageRating,
    pagination: result.pagination,
  });
});

/**
 * DELETE /feedbacks/:id - Delete feedback
 * - Admin: can delete any feedback
 * - User: can only delete their own feedback
 */
export const deleteFeedbackHandler = catchErrors(async (req, res) => {
  // Validate feedback ID
  const { id } = feedbackIdSchema.parse(req.params);

  // Get user info from authenticate middleware
  const userId = (req as any).userId;
  const userRole = req.role;

  // Call service
  const result = await deleteFeedback(id, userId, userRole);

  return res.success(OK, {
    data: null,
    message: result.message,
  });
});

