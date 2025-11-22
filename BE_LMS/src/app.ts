import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Role } from './types';
import { uploadFile } from './utils/uploadFile';
import './models/semester.model'; // ✅ Register Semester model

//config
import upload from './config/multer';

//constants
import { OK } from './constants/http';
import { APP_ORIGIN } from './constants/env';

//middleware

import { authenticate, authorize, customResponse, errorHandler } from './middleware';

//routes
import {
  announcementRoutes,
  assignmentRoutes,
  attendanceRoutes,
  authRoutes,
  courseInviteRoutes,
  courseRoutes,
  enrollmentRoutes,
  feedbackRoutes,
  forumProtectedRoutes,
  forumPublicRoutes,
  lessonMaterialRoutes,
  lessonProgressRoutes,
  lessonRoutes,
  majorProtectedRoutes,
  majorPublicRoutes,
  notificationRoutes,
  quizQuestionRoutes,
  quizRoutes,
  scheduleRoutes,
  sessionRoutes,
  specialistProtectedRoutes,
  specialistPublicRoutes,
  subjectRoutes,
  submissionRoutes,
  userRoutes,
} from './routes';
import quizAttemptRoutes from './routes/quizAttempt.route';

export const createApp = () => {
  const app = express();

  app.use(customResponse);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: APP_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());

  //example API----------------------------------
  app.get('/', (req, res) => {
    res.status(OK).send('Hello World!');
  });

  app.post('/uploadExample', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadFile(file, '/example');
    res.status(200).json(result);
  });
  //-----------------------------------------------

  //auth routes
  app.use('/auth', authRoutes);

  //routes
  app.use('/courses', courseRoutes);
  app.use('/assignments', assignmentRoutes);
  app.use('/submissions', submissionRoutes);
  app.use('/lessons', lessonRoutes);
  app.use('/lesson-materials', lessonMaterialRoutes);
  app.use('/lesson-progress', lessonProgressRoutes);
  app.use('/majors', majorPublicRoutes);
  app.use('/specialists', specialistPublicRoutes);
  app.use('/forums', forumPublicRoutes);
  app.use('/schedules', scheduleRoutes);
  app.use('/announcements', authenticate, announcementRoutes);
  app.use('/users', authenticate, userRoutes);
  app.use('/sessions', authenticate, authorize(Role.ADMIN), sessionRoutes);
  app.use('/enrollments', authenticate, enrollmentRoutes);
  app.use('/feedbacks', feedbackRoutes);
  app.use('/course-invites', authenticate, courseInviteRoutes);
  app.use('/quiz-questions', quizQuestionRoutes);
  app.use('/majors', authenticate, majorProtectedRoutes);
  app.use('/specialists', authenticate, specialistProtectedRoutes);
  app.use('/forums', authenticate, forumProtectedRoutes);
  app.use('/subjects', authenticate, subjectRoutes);
  app.use('/quizzes', quizRoutes);
  app.use('/notifications', authenticate, notificationRoutes);
  app.use('/quiz-attempts', authenticate, quizAttemptRoutes);
  app.use('/attendances', authenticate, attendanceRoutes);

  //error handler
  app.use(errorHandler);

  return app;
};
