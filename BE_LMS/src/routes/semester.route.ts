import {
  createSemesterHandler,
  deleteSemesterHandler,
  getSemesterStatisticsHandler,
  listAllSemestersHandler,
  updateSemesterHandler,
} from '@/controller/semester.controller';
import { authenticate, authorize } from '@/middleware';
import { Role } from '@/types';
import { Router } from 'express';

const semesterRoutes = Router();

// prefix: /semesters
semesterRoutes.post('/', authenticate, authorize(Role.ADMIN), createSemesterHandler);
semesterRoutes.get('/', listAllSemestersHandler);
semesterRoutes.get('/:semesterId/statistics', authenticate, authorize(Role.ADMIN, Role.TEACHER), getSemesterStatisticsHandler);
semesterRoutes.put('/:semesterId', authenticate, authorize(Role.ADMIN), updateSemesterHandler);
semesterRoutes.delete('/:semesterId', authenticate, authorize(Role.ADMIN), deleteSemesterHandler);

export default semesterRoutes;
