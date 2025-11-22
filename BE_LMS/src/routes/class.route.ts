import { Router } from "express";
import {
    createEmptyClassesHandler,
    getClassesByCourseHandler,
    getClassByIdHandler,
    updateClassHandler,
    getTeacherClassesHandler,
    getStudentClassesHandler,
    deleteClassHandler, assignTeacherToClassHandler, assignTeacherAndStudentsHandler, assignStudentsToClassesHandler,
} from "../controller/class.controller";
import { authenticate, authorize } from "../middleware";
import { Role } from "../types";

const classRouter = Router();

// Prefix: /classes

// Public routes

// Get classes for a course
classRouter.get("/courses/:courseId/classes", getClassesByCourseHandler);

// Get specific class details
classRouter.get("/:classId", getClassByIdHandler);

// Protected routes

// Create new empty classes (Admin only)
classRouter.post(
  "/create",
  authenticate,
  authorize(Role.ADMIN),
  createEmptyClassesHandler
);

// Assign students to multiple classes (Admin only)
classRouter.post(
  "/assign-students",
  authenticate,
  authorize(Role.ADMIN),
  assignStudentsToClassesHandler
);

// Assign teacher to a class (Admin only)
classRouter.post(
  "/assign-teacher",
  authenticate,
  authorize(Role.ADMIN),
  assignTeacherToClassHandler
);

// Assign teacher to a class and students to multiple classes (Admin only)
classRouter.post(
  "/assign-all",
  authenticate,
  authorize(Role.ADMIN),
  assignTeacherAndStudentsHandler
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