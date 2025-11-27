import {
  createQuizHandler,
  deleteQuizHandler,
  getQuizAttemptsByQuizIdHandler,
  getQuizByIdHandler,
  getStatisticByQuizIdHandler,
  updateQuizHandler,
} from '@/controller/quiz.controller';

import { Router } from 'express';

const quizRoutes = Router();

// prefix: /quizzes
quizRoutes.post('/', createQuizHandler);
quizRoutes.get('/:quizId/statistics', getStatisticByQuizIdHandler);
quizRoutes.get('/:quizId/quiz-attempts', getQuizAttemptsByQuizIdHandler);
quizRoutes.put('/:quizId', updateQuizHandler);
quizRoutes.delete('/:quizId', deleteQuizHandler);
quizRoutes.get('/:quizId', getQuizByIdHandler);
export default quizRoutes;
