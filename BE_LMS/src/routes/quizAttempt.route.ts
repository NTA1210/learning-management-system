import {
  banQuizAttemptHandler,
  deleteQuizAttemptHandler,
  enrollQuizHandler,
  saveQuizHandler,
  submitQuizHandler,
} from '@/controller/quizAttempt.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';
import express from 'express';

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post('/enroll', authorize(Role.STUDENT), enrollQuizHandler);
quizAttemptRoutes.put('/:quizAttemptId/submit', authorize(Role.STUDENT), submitQuizHandler);
quizAttemptRoutes.put('/:quizAttemptId/save', authorize(Role.STUDENT), saveQuizHandler);
quizAttemptRoutes.delete(
  '/:quizAttemptId',
  authorize(Role.TEACHER, Role.ADMIN),
  deleteQuizAttemptHandler
);
quizAttemptRoutes.put(
  '/:quizAttemptId/ban',
  authorize(Role.ADMIN, Role.TEACHER),
  banQuizAttemptHandler
);

export default quizAttemptRoutes;
