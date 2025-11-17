import { Router } from "express";
import {
  listAllLessonMaterialsController,
  getLessonMaterialsByLessonController,
  getLessonMaterialByIdController,
  createLessonMaterialController,
  updateLessonMaterialController,
  deleteLessonMaterialController,
  downloadLessonMaterialController,
  uploadLessonMaterialController,
  deleteLessonMaterialFile,
} from "../controller/lessonMaterial.controller";
import authenticate from "@/middleware/authenticate";
import authorize from "@/middleware/authorize";
import { Role } from "../types";
import upload from "@/config/multer";

const lessonMaterialRoutes = Router();

// prefix: /lesson-material

// Protected routes (require authentication)
// GET /lesson-material - List Lesson Material (search/lọc/phân trang)
lessonMaterialRoutes.get("/", authenticate, listAllLessonMaterialsController);
// GET /lesson-material/lesson/:lessonId - Lấy theo lessonId
lessonMaterialRoutes.get("/lessons/:lessonId", authenticate, getLessonMaterialsByLessonController);
// GET /lesson-material/id/:id - Chi tiết Lesson Material theo ID
lessonMaterialRoutes.get("/:id", authenticate, getLessonMaterialByIdController);
// GET /lesson-material/id/:id/download - Chuẩn bị tải xuống
lessonMaterialRoutes.get("/:id/download", authenticate, downloadLessonMaterialController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson-material - Tạo Lesson Material (Admin/Teacher only)
lessonMaterialRoutes.post("/", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLessonMaterialController);
// POST /lesson-material/upload - Upload file(s) tài liệu (Admin/Teacher only)
// Supports both single file (field: 'file') and multiple files (field: 'files')
lessonMaterialRoutes.post("/upload", authenticate, authorize(Role.TEACHER, Role.ADMIN), upload.any(), uploadLessonMaterialController);
// PATCH /lesson-material/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonMaterialRoutes.patch("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLessonMaterialController);
// DELETE /lesson-material/id/:id - Xóa theo ID (Admin/Teacher only)
lessonMaterialRoutes.delete("/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialController);
// DELETE /lesson-material/id/:id/file - Xóa file tài liệu (Admin/Teacher only)
lessonMaterialRoutes.delete("/:id/file", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialFile);

export default lessonMaterialRoutes;
