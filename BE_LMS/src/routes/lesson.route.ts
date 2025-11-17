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

const lessonRouters = Router();

// prefix: /lesson

// Protected routes (require authentication)
// GET /lesson - List Lesson (search/lọc/phân trang)
lessonRouters.get("/", listAllLessons);
// GET /lesson/course/:courseId - Get lessons for a specific course
lessonRouters.get("/course/:courseId", getLessonsByCourseController);
// GET /lesson/id/:id - Chi tiết Lesson theo ID
lessonRouters.get("/:id", getLessonByIdController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson - Tạo Lesson (Admin/Teacher only)
lessonRouters.post("/", authorize(Role.TEACHER, Role.ADMIN), createLesson);
// PATCH /lesson/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonRouters.patch("/:id", authorize(Role.TEACHER, Role.ADMIN), updateLesson);
// DELETE /lesson/id/:id - Xóa theo ID (Admin/Teacher only)
lessonRouters.delete("/:id", authorize(Role.TEACHER, Role.ADMIN), deleteLesson);

export default lessonRouters;
