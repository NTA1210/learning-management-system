import { Router } from "express";

import { listAllLessons, getLessonByIdController, getLessonsByCourseController } from "../controller/lesson.controller";

import authenticate from "@/middleware/authenticate";
import { Role } from "../types";
import authorize from "@/middleware/authorize";

const lessonRoutes = Router();

//prefix : /lesson

// Public routes (with authentication for access control)
lessonRoutes.get("/listAllLessons", authenticate, listAllLessons);
lessonRoutes.get("/byCourse/:courseId", authenticate, getLessonsByCourseController);
lessonRoutes.get("/getLessonById/:id", authenticate, getLessonByIdController);

export default lessonRoutes;