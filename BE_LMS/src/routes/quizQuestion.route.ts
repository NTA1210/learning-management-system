import upload from "@/config/multer";
import {
  createQuizQuestionHandler,
  deleteImageHandler,
  deleteMultiQuizQuestionByIdHandler,
  deleteQuizQuestionByIdHandler,
  exportXMLFileHandler,
  getAllQuizQuestionsHandler,
  getRandomQuestionsHandler,
  importXMLFileHandler,
  updateQuizQuestionByIdHandler,
  uploadImagesHandler,
} from "@/controller/quizQuestion.controller";
import { authorize } from "@/middleware";
import { Role } from "@/types";
import { Router } from "express";

const quizQuestionRoutes = Router();
//prefix: /quiz-questions

quizQuestionRoutes.post("/import", upload.single("file"), importXMLFileHandler);

quizQuestionRoutes.get("/export/:subjectId", exportXMLFileHandler);
quizQuestionRoutes.get("/", getAllQuizQuestionsHandler);
quizQuestionRoutes.post("/", upload.array("files"), createQuizQuestionHandler);
quizQuestionRoutes.put(
  "/:quizQuestionId",
  upload.array("files"),
  updateQuizQuestionByIdHandler
);
quizQuestionRoutes.delete("/image", deleteImageHandler);
quizQuestionRoutes.delete("/:quizQuestionId", deleteQuizQuestionByIdHandler);
quizQuestionRoutes.delete("/", deleteMultiQuizQuestionByIdHandler);
quizQuestionRoutes.get("/random", getRandomQuestionsHandler);
quizQuestionRoutes.post("/images", upload.array("files"), uploadImagesHandler);

export default quizQuestionRoutes;
