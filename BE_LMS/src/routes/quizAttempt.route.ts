import {
  enrollQuizHandler,
  submitQuizHandler,
} from "@/controller/quizAttempt.controller";
import { authenticate, authorize } from "@/middleware";
import { Role } from "@/types";
import express from "express";

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post("/enroll", authenticate, enrollQuizHandler);
quizAttemptRoutes.put(
  "/:quizAttemptId/submit",
  authenticate,
  authorize(Role.STUDENT),
  submitQuizHandler
);

export default quizAttemptRoutes;
