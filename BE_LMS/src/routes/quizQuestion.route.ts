import upload from '@/config/multer';
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
} from '@/controller/quizQuestion.controller';
import { authorize } from '@/middleware';
import { Role } from '@/types';
import { Router } from 'express';

const quizQuestionRoutes = Router();
//prefix: /quiz-questions

quizQuestionRoutes.post(
  '/import',
  authorize(Role.ADMIN),
  upload.single('file'),
  importXMLFileHandler
);
quizQuestionRoutes.get('/export/:subjectId', authorize(Role.ADMIN), exportXMLFileHandler);
quizQuestionRoutes.get('/', authorize(Role.ADMIN, Role.TEACHER), getAllQuizQuestionsHandler);
quizQuestionRoutes.post(
  '/',
  authorize(Role.ADMIN),
  upload.array('files'),
  createQuizQuestionHandler
);
quizQuestionRoutes.put(
  '/:quizQuestionId',
  authorize(Role.ADMIN),
  upload.array('files'),
  updateQuizQuestionByIdHandler
);
quizQuestionRoutes.delete('/image', authorize(Role.ADMIN, Role.TEACHER), deleteImageHandler);
quizQuestionRoutes.delete('/:quizQuestionId', authorize(Role.ADMIN), deleteQuizQuestionByIdHandler);
quizQuestionRoutes.delete('/', authorize(Role.ADMIN), deleteMultiQuizQuestionByIdHandler);
quizQuestionRoutes.get('/random', authorize(Role.ADMIN, Role.TEACHER), getRandomQuestionsHandler);
quizQuestionRoutes.post(
  '/images',
  authorize(Role.ADMIN, Role.TEACHER),
  upload.array('files'),
  uploadImagesHandler
);

export default quizQuestionRoutes;
