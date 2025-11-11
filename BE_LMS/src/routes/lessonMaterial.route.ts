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
  deleteLessonMaterialFile
} from "../controller/lessonMaterial.controller";

import authenticate from "@/middleware/authenticate";
import { Role } from "../types";
import authorize from "@/middleware/authorize";
import upload from "@/config/multer";


const lessonMaterialRoutes = Router();

//prefix : /lesson-material

// GET /lesson-material/listAllMaterials - Liệt kê tài liệu (auth required)
lessonMaterialRoutes.get("/listAllMaterials", authenticate, listAllLessonMaterialsController);
// GET /lesson-material/byLesson/:lessonId - Lấy theo lessonId (auth required)
lessonMaterialRoutes.get("/byLesson/:lessonId", authenticate, getLessonMaterialsByLessonController);
// GET /lesson-material/getMaterialById/:id - Lấy chi tiết tài liệu (auth required)
lessonMaterialRoutes.get("/getMaterialById/:id", authenticate, getLessonMaterialByIdController);
// GET /lesson-material/download/:id - Chuẩn bị tải xuống (auth required)
lessonMaterialRoutes.get("/download/:id", authenticate, downloadLessonMaterialController);

// POST /lesson-material/createMaterial - Tạo tài liệu (teacher/admin)
lessonMaterialRoutes.post("/createMaterial", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLessonMaterialController);
// POST /lesson-material/uploadMaterial - Upload file(s) tài liệu (teacher/admin)
// Supports both single file (field: 'file') and multiple files (field: 'files')
lessonMaterialRoutes.post("/uploadMaterial", authenticate, authorize(Role.TEACHER, Role.ADMIN), upload.any(), uploadLessonMaterialController);
// PUT /lesson-material/updateMaterial/:id - Cập nhật tài liệu (teacher/admin)
lessonMaterialRoutes.put("/updateMaterial/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLessonMaterialController);
// DELETE /lesson-material/deleteMaterial/:id - Xóa tài liệu (teacher/admin)
lessonMaterialRoutes.delete("/deleteMaterial/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialController);
//DELTE /lesson-material/deleteFileOfMaterial/:id - Xóa file tài liệu (teacher/admin)
lessonMaterialRoutes.delete("/deleteFileOfMaterial/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialFile);

export default lessonMaterialRoutes;  
