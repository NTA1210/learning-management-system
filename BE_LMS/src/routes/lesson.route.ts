import { Router } from "express";

import { listAllLessons, getLessonByIdController, getLessonsByCourseController,createLesson, deleteLesson, updateLesson } from "../controller/lesson.controller";

import authenticate from "@/middleware/authenticate";
import { Role } from "../types";
import authorize from "@/middleware/authorize";

const lessonRoutes = Router();

//prefix : /lesson

// Public routes (with authentication for access control)
lessonRoutes.get("/listAllLessons", authenticate, listAllLessons);
lessonRoutes.get("/byCourse/:courseId", authenticate, getLessonsByCourseController);
lessonRoutes.get("/getLessonById/:id", authenticate, getLessonByIdController);

// Teacher/Admin only routes
lessonRoutes.post("/createLessons", authenticate, authorize(Role.TEACHER, Role.ADMIN), createLesson);
lessonRoutes.put("/updateLessons/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), updateLesson);
lessonRoutes.delete("/deleteLessons/:id", authenticate, authorize(Role.TEACHER, Role.ADMIN), deleteLesson);
export default lessonRoutes;