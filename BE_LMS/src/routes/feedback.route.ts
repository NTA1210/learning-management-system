import { Router } from "express";
import {
  createFeedbackHandler,
  listFeedbacksHandler,
  getFeedbackByIdHandler,
  getMyFeedbacksHandler,
  getFeedbacksByTargetHandler,
  deleteFeedbackHandler,
} from "@/controller/feedback.controller";
import authenticate from "@/middleware/authenticate";
import upload from "@/config/multer";

const feedbackRoutes = Router();

// prefix: /feedbacks

/**
 * All feedback routes require authentication
 */

// POST /feedbacks - Create new feedback (with optional file attachment)
feedbackRoutes.post("/", authenticate, upload.single("file"), createFeedbackHandler);

// GET /feedbacks/my-feedbacks - Get current user's feedbacks
// Note: This must come BEFORE /:id to avoid matching "my-feedbacks" as an ID
feedbackRoutes.get("/my-feedbacks", authenticate, getMyFeedbacksHandler);

// GET /feedbacks/target/:targetId - Get feedbacks about a specific target
feedbackRoutes.get("/target/:targetId", authenticate, getFeedbacksByTargetHandler);

// GET /feedbacks - List all feedbacks with filters
feedbackRoutes.get("/", authenticate, listFeedbacksHandler);

// GET /feedbacks/:id - Get feedback by ID
feedbackRoutes.get("/:id", authenticate, getFeedbackByIdHandler);

// DELETE /feedbacks/:id - Delete feedback
feedbackRoutes.delete("/:id", authenticate, deleteFeedbackHandler);

export default feedbackRoutes;

