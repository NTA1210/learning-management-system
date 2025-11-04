import { Router } from "express";
import {
  listCoursesHandler,
  getCourseByIdHandler,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
  restoreCourseHandler,
  permanentDeleteCourseHandler,
} from "../controller/course.controller";
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const courseRoutes = Router();

// prefix: /courses

// Public routes
// GET /courses - List all courses with pagination and filters
courseRoutes.get("/", listCoursesHandler);

// GET /courses/:id - Get course detail by ID
courseRoutes.get("/:id", getCourseByIdHandler);

// Protected routes (require authentication)
// POST /courses - Create new course (Teacher/Admin only)
// ✅ FIX: Added authorize middleware to prevent students from creating courses
courseRoutes.post("/", authenticate, authorize(Role.TEACHER, Role.ADMIN), createCourseHandler);

// PUT /courses/:id - Update course (Teacher of course or Admin only)
courseRoutes.put("/:id", authenticate, updateCourseHandler);

// DELETE /courses/:id - Soft delete course (Teacher of course or Admin only)
courseRoutes.delete("/:id", authenticate, deleteCourseHandler);

// POST /courses/:id/restore - Restore deleted course (Admin only)
// ✅ FIX: Added authorize middleware - only admin can restore
courseRoutes.post("/:id/restore", authenticate, authorize(Role.ADMIN), restoreCourseHandler);

// DELETE /courses/:id/permanent - Permanently delete course from database (Admin only)
// ⚠️ WARNING: This action CANNOT be undone!
// ✅ FIX: Added authorize middleware - only admin can permanently delete
courseRoutes.delete("/:id/permanent", authenticate, authorize(Role.ADMIN), permanentDeleteCourseHandler);

export default courseRoutes;

