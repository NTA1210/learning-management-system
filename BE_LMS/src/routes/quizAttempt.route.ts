import { enrollQuizHandler } from "@/controller/quizAttempt.controller";
import express from "express";

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post("/enroll", enrollQuizHandler);

export default quizAttemptRoutes;
