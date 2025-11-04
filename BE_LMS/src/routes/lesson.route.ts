import { Router } from "express";

import {
  listAllLessons,
  getLessonByIdController,
  getLessonsByCourseController,
  createLesson,
  deleteLesson,
  updateLesson,
} from "../controller/lesson.controller";

import authenticate from "@/middleware/authenticate";
import { Role } from "../types";
import authorize from "@/middleware/authorize";

const lessonRoutes = Router();

//prefix : /lesson

// GET /lesson/listAllLessons - List lessons with filters (auth required)
lessonRoutes.get("/listAllLessons", authenticate, listAllLessons);
// GET /lesson/byCourse/:courseId - Get lessons for a specific course (auth required)
lessonRoutes.get(
  "/byCourse/:courseId",
  authenticate,
  getLessonsByCourseController
);
// GET /lesson/getLessonById/:id - Get a lesson by id (auth required)
lessonRoutes.get("/getLessonById/:id", authenticate, getLessonByIdController);

// POST /lesson/createLessons - Create a lesson (teacher/admin)
lessonRoutes.post(
  "/createLessons",
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  createLesson
);
// PUT /lesson/updateLessons/:id - Update a lesson (teacher/admin)
lessonRoutes.put(
  "/updateLessons/:id",
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  updateLesson
);
// DELETE /lesson/deleteLessons/:id - Delete a lesson (teacher/admin)
lessonRoutes.delete(
  "/deleteLessons/:id",
  authenticate,
  authorize(Role.TEACHER, Role.ADMIN),
  deleteLesson
);

export default lessonRoutes;
