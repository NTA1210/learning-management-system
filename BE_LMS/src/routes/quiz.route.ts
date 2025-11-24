import {
  createQuizHandler,
  deleteQuizHandler,
  getQuizByIdHandler,
  getStatisticByQuizIdHandler,
  updateQuizHandler,
} from '@/controller/quiz.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';

import { Router } from 'express';

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post('/', authorize(Role.TEACHER, Role.ADMIN), createQuizHandler);
quizRoutes.put('/:quizId', authorize(Role.TEACHER, Role.ADMIN), updateQuizHandler);
quizRoutes.delete('/:quizId', authorize(Role.TEACHER, Role.ADMIN), deleteQuizHandler);
quizRoutes.get('/:quizId', getQuizByIdHandler);
quizRoutes.get(
  '/:quizId/statistics',
  authorize(Role.TEACHER, Role.ADMIN),
  getStatisticByQuizIdHandler
);

export default quizRoutes;
