import upload from "@/config/multer";
import {
  exportXMLFileHandler,
  getAllQuizQuestionsHandler,
  importXMLFileHandler,
} from "@/controller/quizQuestion.controller";
import { authorize } from "@/middleware";
import { Role } from "@/types";
import { Router } from "express";

const quizQuestionRoutes = Router();
//prefix: /quiz-questions

quizQuestionRoutes.post(
  "/import",
  authorize(Role.ADMIN),
  upload.single("file"),
  importXMLFileHandler
);

quizQuestionRoutes.get("/export/:courseId", exportXMLFileHandler);
quizQuestionRoutes.get("/", getAllQuizQuestionsHandler);

export default quizQuestionRoutes;
