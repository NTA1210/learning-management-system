import {
  createQuizHandler,
  deleteQuizHandler,
  getStatisticByQuizIdHandler,
  updateQuizHandler,
} from '@/controller/quiz.controller';

import { Router } from 'express';

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post('/', createQuizHandler);
quizRoutes.put('/:quizId', updateQuizHandler);
quizRoutes.delete('/:quizId', deleteQuizHandler);
quizRoutes.get('/:quizId/statistics', getStatisticByQuizIdHandler);

export default quizRoutes;
