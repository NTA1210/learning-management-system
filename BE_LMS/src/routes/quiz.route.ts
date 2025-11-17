import {
  createQuizHandler,
  deleteQuizHandler,
  updateQuizHandler,
} from "@/controller/quiz.controller";
import { authenticate } from "@/middleware";
import { Router } from "express";

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post("/", authenticate, createQuizHandler);
quizRoutes.put("/:quizId", updateQuizHandler);
quizRoutes.delete("/:quizId", deleteQuizHandler);

export default quizRoutes;
