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

const lessonMaterialRouter = Router();

// prefix: /lesson-material

// Protected routes (require authentication)
// GET /lesson-material - List Lesson Material (search/lọc/phân trang)
lessonMaterialRouter.get("/", authenticate, listAllLessonMaterialsController);
// GET /lesson-material/lesson/:lessonId - Lấy theo lessonId
lessonMaterialRouter.get("/lesson/:lessonId", authenticate, getLessonMaterialsByLessonController);
// GET /lesson-material/id/:id - Chi tiết Lesson Material theo ID
lessonMaterialRouter.get("/id/:id", authenticate, getLessonMaterialByIdController);
// GET /lesson-material/id/:id/download - Chuẩn bị tải xuống
lessonMaterialRouter.get("/id/:id/download", authenticate, downloadLessonMaterialController);

// Protected routes (require authentication + admin/teacher role)
// POST /lesson-material - Tạo Lesson Material (Admin/Teacher only)
lessonMaterialRouter.post("/", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLessonMaterialController);
// POST /lesson-material/upload - Upload file(s) tài liệu (Admin/Teacher only)
// Supports both single file (field: 'file') and multiple files (field: 'files')
lessonMaterialRouter.post("/upload", authenticate, authorize(Role.TEACHER, Role.ADMIN), upload.any(), uploadLessonMaterialController);
// PATCH /lesson-material/id/:id - Cập nhật theo ID (Admin/Teacher only)
lessonMaterialRouter.patch("/id/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLessonMaterialController);
// DELETE /lesson-material/id/:id - Xóa theo ID (Admin/Teacher only)
lessonMaterialRouter.delete("/id/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialController);
// DELETE /lesson-material/id/:id/file - Xóa file tài liệu (Admin/Teacher only)
lessonMaterialRouter.delete("/id/:id/file", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialFile);

export default lessonMaterialRouter;
