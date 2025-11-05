import upload from "@/config/multer";
import {
  createQuizQuestionHandler,
  deleteMultiQuizQuestionByIdHandler,
  deleteQuizQuestionByIdHandler,
  exportXMLFileHandler,
  getAllQuizQuestionsHandler,
  getRandomQuestionsHandler,
  importXMLFileHandler,
  updateQuizQuestionByIdHandler,
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
quizQuestionRoutes.post("/", upload.single("file"), createQuizQuestionHandler);
quizQuestionRoutes.put(
  "/:quizQuestionId",
  upload.single("file"),
  updateQuizQuestionByIdHandler
);
quizQuestionRoutes.delete("/:quizQuestionId", deleteQuizQuestionByIdHandler);
quizQuestionRoutes.delete("/", deleteMultiQuizQuestionByIdHandler);
quizQuestionRoutes.get("/random_questions", getRandomQuestionsHandler);

export default quizQuestionRoutes;
