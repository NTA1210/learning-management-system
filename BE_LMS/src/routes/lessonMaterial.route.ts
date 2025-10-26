import { Router } from "express";


import authenticate from "@/middleware/authenticate";
import { getLessonMaterialByIdController, getLessonMaterialsByLessonController, listAllLessonMaterials } from "@/controller/lessonMaterial.controller";

const lessonMaterialRoutes = Router();

//prefix : /lesson-material

// Public routes (with authentication for access control)
lessonMaterialRoutes.get("/listAllMaterials", authenticate, listAllLessonMaterials);
lessonMaterialRoutes.get("/byLesson/:lessonId", authenticate, getLessonMaterialsByLessonController);
lessonMaterialRoutes.get("/getMaterialById/:id", authenticate, getLessonMaterialByIdController);

export default lessonMaterialRoutes;