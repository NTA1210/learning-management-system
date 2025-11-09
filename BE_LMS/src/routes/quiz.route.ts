import {
  addSnapshotQuestionsHandler,
  createQuizHandler,
} from "@/controller/quiz.controller";
import { Router } from "express";

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post("/", createQuizHandler);
quizRoutes.put("/", addSnapshotQuestionsHandler);

export default quizRoutes;
