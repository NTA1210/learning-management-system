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

const lessonRouter = Router();

// prefix: /lesson

// Protected routes (require authentication)
// GET /lesson - List Lesson (search/lọc/phân trang)
lessonRouter.get("/", authenticate, listAllLessons);
// GET /lesson/id/:id - Chi tiết Lesson theo ID
lessonRouter.get("/:id", authenticate, getLessonByIdController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson - Tạo Lesson (Admin/Teacher only)
lessonRouter.post("/", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLesson);
// PUT /lesson/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonRouter.put("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLesson);
// DELETE /lesson/id/:id - Xóa theo ID (Admin/Teacher only)
lessonRouter.delete("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLesson);

export default lessonRouter;
