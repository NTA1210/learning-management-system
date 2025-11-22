import { enrollQuizHandler, submitQuizHandler } from '@/controller/quizAttempt.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';
import express from 'express';

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post('/enroll', authorize(Role.STUDENT), enrollQuizHandler);
quizAttemptRoutes.put('/:quizAttemptId/submit', authorize(Role.STUDENT), submitQuizHandler);

export default quizAttemptRoutes;
