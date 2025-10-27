import { Router } from "express";

import { 
  listAllLessonMaterials, 
  getLessonMaterialsByLessonController, 
  getLessonMaterialByIdController, 
  createLessonMaterialController, 
  updateLessonMaterialController, 
  deleteLessonMaterialController,
  downloadLessonMaterialController,
  uploadLessonMaterialController
} from "../controller/lessonMaterial.controller";

import authenticate from "@/middleware/authenticate";
import { Role } from "../types";
import authorize from "@/middleware/authorize";
import upload from "@/config/multer";


const lessonMaterialRoutes = Router();

//prefix : /lesson-material

// Public routes (with authentication for access control)
lessonMaterialRoutes.get("/listAllMaterials", authenticate, listAllLessonMaterials);
lessonMaterialRoutes.get("/byLesson/:lessonId", authenticate, getLessonMaterialsByLessonController);
lessonMaterialRoutes.get("/getMaterialById/:id", authenticate, getLessonMaterialByIdController);
lessonMaterialRoutes.get("/download/:id", authenticate, downloadLessonMaterialController);

// Teacher/Admin only routes
lessonMaterialRoutes.post("/createMaterial", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLessonMaterialController);
lessonMaterialRoutes.post("/uploadMaterial", authenticate, authorize(Role.TEACHER, Role.ADMIN), upload.single('file'), uploadLessonMaterialController);
lessonMaterialRoutes.put("/updateMaterial/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLessonMaterialController);
lessonMaterialRoutes.delete("/deleteMaterial/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLessonMaterialController);

export default lessonMaterialRoutes;  
