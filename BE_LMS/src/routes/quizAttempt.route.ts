import {
  autoSaveQuizHandler,
  banQuizAttemptHandler,
  deleteQuizAttemptHandler,
  enrollQuizHandler,
  getQuizAttemptByIdHandler,
  gradeQuizAttemptHandler,
  saveQuizHandler,
  submitQuizHandler,
  updateQuizAttemptScoreHandler,
} from '@/controller/quizAttempt.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';
import express from 'express';

// prefix: /quiz-attempts
const quizAttemptRoutes = express.Router();

quizAttemptRoutes.post('/enroll', enrollQuizHandler);
quizAttemptRoutes.put('/:quizAttemptId/submit', submitQuizHandler);
quizAttemptRoutes.put('/:quizAttemptId/save', saveQuizHandler);
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

quizAttemptRoutes.put('/:quizAttemptId/auto-save', autoSaveQuizHandler);
quizAttemptRoutes.get('/:quizAttemptId', getQuizAttemptByIdHandler);
quizAttemptRoutes.put(
  '/:quizAttemptId/re-grade',
  authorize(Role.TEACHER, Role.ADMIN),
  gradeQuizAttemptHandler
);
quizAttemptRoutes.put(
  '/:quizAttemptId',
  authorize(Role.TEACHER, Role.ADMIN),
  updateQuizAttemptScoreHandler
);
export default quizAttemptRoutes;
