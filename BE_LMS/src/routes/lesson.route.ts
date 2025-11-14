import { Router } from "express";
import {
  listAllLessons,
  getLessonByIdController,
  getLessonsByCourseController,
  createLesson,
  deleteLesson,
  updateLesson,
} from "../controller/lesson.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const lessonRouter = Router();

// prefix: /lesson

// Protected routes (require authentication)
// GET /lesson - List Lesson (search/lọc/phân trang)
lessonRouter.get("/", listAllLessons);
// GET /lesson/course/:courseId - Get lessons for a specific course
lessonRouter.get("/course/:courseId", getLessonsByCourseController);
// GET /lesson/id/:id - Chi tiết Lesson theo ID
lessonRouter.get("/id/:id", getLessonByIdController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson - Tạo Lesson (Admin/Teacher only)
lessonRouter.post("/", authorize(Role.TEACHER, Role.ADMIN), createLesson);
// PATCH /lesson/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonRouter.patch("/id/:id", authorize(Role.TEACHER, Role.ADMIN), updateLesson);
// DELETE /lesson/id/:id - Xóa theo ID (Admin/Teacher only)
lessonRouter.delete("/id/:id", authorize(Role.TEACHER, Role.ADMIN), deleteLesson);

export default lessonRouter;
