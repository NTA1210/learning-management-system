import { Router } from "express";
import { listCoursesHandler } from "../controller/course.controller";

const courseRoutes = Router();

// prefix: /courses

// GET /courses - List all courses with pagination and filters
courseRoutes.get("/", listCoursesHandler);

export default courseRoutes;

