import { Router } from "express";
import {
  createClassHandler,
  getClassesByCourseHandler,
  getClassByIdHandler,
  updateClassHandler,
  getTeacherClassesHandler,
  getStudentClassesHandler,
  deleteClassHandler,
} from "../controller/class.controller";
import { authenticate, authorize } from "../middleware";
import { Role } from "../types";

const classRouter = Router();

// Public routes

// Get classes for a course
classRouter.get("/courses/:courseId/classes", getClassesByCourseHandler);

// Get specific class details
classRouter.get("/:classId", getClassByIdHandler);

// Protected routes

// Create new class (Admin only)
classRouter.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  createClassHandler
);

// Update class (Admin only)
classRouter.patch(
  "/:classId",
  authenticate,
  authorize(Role.ADMIN),
  updateClassHandler
);

// Delete class (Admin only)
classRouter.delete(
  "/:classId",
  authenticate,
  authorize(Role.ADMIN),
  deleteClassHandler
);

// Get teacher's classes (Teachers can view their own, Admin can view all)
classRouter.get(
  "/teachers/:teacherId/classes",
  authenticate,
  getTeacherClassesHandler
);

// Get student's enrolled classes
classRouter.get(
  "/students/:studentId/classes",
  authenticate,
  getStudentClassesHandler
);

export default classRouter;