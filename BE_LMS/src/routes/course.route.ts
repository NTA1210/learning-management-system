import { Router } from "express";
import {
listCoursesHandler,
getCourseByIdHandler,
} from "../controller/course.controller";

const courseRoutes = Router();

// prefix: /courses

// Public routes
// GET /courses - List all courses with pagination and filters
courseRoutes.get("/", listCoursesHandler);

// GET /courses/:id - Get course detail by ID
courseRoutes.get("/:id", getCourseByIdHandler);

export default courseRoutes;

