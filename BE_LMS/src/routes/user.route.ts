import { Router } from 'express';
import {
  getUserHandler,
  getUserForCourseHandler,
  updateUserProfileHandler,
} from '../controller/user.controller';
import { authenticate, authorize } from '@/middleware';
import { Role } from '@/types';
import upload from '@/config/multer';

const userRoutes = Router();

//prefix : /users
userRoutes.get('/me', getUserHandler);
userRoutes.get('/', getUserForCourseHandler);
userRoutes.put('/:userId', authenticate, upload.single('avatar'), updateUserProfileHandler);
export default userRoutes;
