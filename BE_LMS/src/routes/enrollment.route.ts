import { Router } from "express";
import {
  getEnrollmentHandler,
  getMyEnrollmentsHandler,
  getStudentEnrollmentsHandler,
  getCourseEnrollmentsHandler,
  getAllEnrollmentsHandler,
  createEnrollmentHandler,
  enrollSelfHandler,
  updateEnrollmentHandler,
  updateSelfEnrollmentHandler,
  kickStudentHandler,
  getEnrollmentStatisticsHandler,
} from "../controller/enrollment.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types";

const enrollmentRoutes = Router();

// prefix: /enrollments

// GET /enrollments - List all enrollments (admin view)
enrollmentRoutes.get("/", authorize(Role.ADMIN, Role.TEACHER), getAllEnrollmentsHandler);

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

// GET /enrollments/:id/statistics - Get enrollment statistics
enrollmentRoutes.get(
  "/:id/statistics",
  authorize(Role.ADMIN, Role.TEACHER, Role.STUDENT),
  getEnrollmentStatisticsHandler
);

// POST /enrollments - Admin tạo enrollment cho student
enrollmentRoutes.post(
  "/",
  authorize(Role.ADMIN, Role.TEACHER),
  createEnrollmentHandler
);

// POST /enrollments/enroll - Student tự enroll vào course
enrollmentRoutes.post(
  "/enroll",
  authorize(Role.STUDENT),
  enrollSelfHandler
);

// PUT /enrollments/my-enrollments/:id - Student update own enrollment
enrollmentRoutes.put(
  "/my-enrollments/:id",
  authorize(Role.STUDENT),
  updateSelfEnrollmentHandler
);

// PUT /enrollments/:id - Admin/Teacher update enrollment
enrollmentRoutes.put(
  "/:id",
  authorize(Role.ADMIN, Role.TEACHER),
  updateEnrollmentHandler
);

// POST /enrollments/:id/kick - Kick student from course (Admin/Teacher)
enrollmentRoutes.post(
  "/:id/kick",
  authorize(Role.ADMIN, Role.TEACHER),
  kickStudentHandler
);

export default enrollmentRoutes;

