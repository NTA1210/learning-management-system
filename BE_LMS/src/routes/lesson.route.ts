import { Router } from "express";
import {
  listAllLessons,
  getLessonByIdController,
  createLesson,
  deleteLesson,
  updateLesson,
} from "../controller/lesson.controller";
import authenticate from "@/middleware/authenticate";
import authorize from "@/middleware/authorize";
import { Role } from "../types";

const lessonRoutes = Router();

// prefix: /lesson

// Protected routes (require authentication)
// GET /lesson - List Lesson (search/lọc/phân trang)
lessonRoutes.get("/", authenticate, listAllLessons);
// GET /lesson/id/:id - Chi tiết Lesson theo ID
lessonRoutes.get("/:id", authenticate, getLessonByIdController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson - Tạo Lesson (Admin/Teacher only)
lessonRoutes.post("/", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLesson);
// PUT /lesson/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonRoutes.put("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLesson);
// DELETE /lesson/id/:id - Xóa theo ID (Admin/Teacher only)
lessonRoutes.delete("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLesson);

export default lessonRoutes;
