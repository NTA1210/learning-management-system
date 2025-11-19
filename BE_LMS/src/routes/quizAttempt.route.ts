import { enrollQuizHandler } from "@/controller/quizAttempt.controller";
import express from "express";

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post("/", enrollQuizHandler);

export default quizAttemptRoutes;
