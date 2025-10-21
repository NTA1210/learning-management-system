import { Router } from "express";
import {
  getEnrollmentHandler,
  getMyEnrollmentsHandler,
  getStudentEnrollmentsHandler,
  getCourseEnrollmentsHandler,
  getAllEnrollmentsHandler,
} from "../controller/enrollment.controller";

const enrollmentRoutes = Router();

// prefix: /enrollments

// GET /enrollments - List all enrollments (admin view)
enrollmentRoutes.get("/", getAllEnrollmentsHandler);

// GET /enrollments/my-enrollments - Get my enrollments
enrollmentRoutes.get("/my-enrollments", getMyEnrollmentsHandler);

// GET /enrollments/student/:studentId - Get enrollments for a student
enrollmentRoutes.get("/student/:studentId", getStudentEnrollmentsHandler);

// GET /enrollments/course/:courseId - Get enrollments for a course
enrollmentRoutes.get("/course/:courseId", getCourseEnrollmentsHandler);

// GET /enrollments/:id - Get enrollment by ID
enrollmentRoutes.get("/:id", getEnrollmentHandler);

export default enrollmentRoutes;

