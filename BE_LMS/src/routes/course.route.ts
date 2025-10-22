import { Router } from "express";
import {
  listCoursesHandler,
  getCourseByIdHandler,
  createCourseHandler,
  updateCourseHandler,
} from "../controller/course.controller";
import authenticate from "../middleware/authenticate";

const courseRoutes = Router();

// prefix: /courses

// Public routes
// GET /courses - List all courses with pagination and filters
courseRoutes.get("/", listCoursesHandler);

// GET /courses/:id - Get course detail by ID
courseRoutes.get("/:id", getCourseByIdHandler);

// Protected routes (require authentication)
// POST /courses - Create new course (Teacher/Admin only)
courseRoutes.post("/", authenticate, createCourseHandler);

// PUT /courses/:id - Update course (Teacher of course or Admin only)
courseRoutes.put("/:id", authenticate, updateCourseHandler);

export default courseRoutes;

