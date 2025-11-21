import {
  createQuizHandler,
  deleteQuizHandler,
  getQuizzesHandler,
  updateQuizHandler,
} from '@/controller/quiz.controller';
import { authenticate, authorize } from '@/middleware';
import { Role } from '@/types';
import { Router } from 'express';

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post('/', authenticate, authorize(Role.TEACHER, Role.ADMIN), createQuizHandler);
quizRoutes.put('/:quizId', authenticate, authorize(Role.TEACHER, Role.ADMIN), updateQuizHandler);
quizRoutes.delete('/:quizId', authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteQuizHandler);
quizRoutes.get('/', authenticate, getQuizzesHandler);

export default quizRoutes;
