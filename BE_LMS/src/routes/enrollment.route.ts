import { Router } from "express";
import {
  getEnrollmentHandler,
  getMyEnrollmentsHandler,
  getStudentEnrollmentsHandler,
  getCourseEnrollmentsHandler,
  getAllEnrollmentsHandler,
} from "../controller/enrollment.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const enrollmentRoutes = Router();

// prefix: /enrollments

// GET /enrollments - List all enrollments (admin view)
enrollmentRoutes.get("/", authorize(Role.ADMIN), getAllEnrollmentsHandler);

// GET /enrollments/my-enrollments - Get my enrollments
enrollmentRoutes.get("/my-enrollments", getMyEnrollmentsHandler);

// GET /enrollments/student/:studentId - Get enrollments for a student
enrollmentRoutes.get(
  "/student/:studentId",
  authorize(Role.ADMIN, Role.TEACHER),
  getStudentEnrollmentsHandler
);

// GET /enrollments/course/:courseId - Get enrollments for a course
enrollmentRoutes.get(
  "/course/:courseId",
  authorize(Role.ADMIN, Role.TEACHER),
  getCourseEnrollmentsHandler
);

// GET /enrollments/:id - Get enrollment by ID (Admin & Teacher only)
enrollmentRoutes.get(
  "/:id",
  authorize(Role.ADMIN, Role.TEACHER),
  getEnrollmentHandler
);

export default enrollmentRoutes;

