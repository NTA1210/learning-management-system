import { Router } from "express";
import {
  getEnrollmentHandler,
  getMyEnrollmentsHandler,
  getStudentEnrollmentsHandler,
  getCourseEnrollmentsHandler,
  getAllEnrollmentsHandler,
  createEnrollmentHandler,
  enrollSelfHandler,
} from "../controller/enrollment.controller";
import authorize from "../middleware/authorize";
import { Role } from "../types";
import { Request, Response, NextFunction } from "express";

const enrollmentRoutes = Router();

enrollmentRoutes.use((req: Request, res: Response, next: NextFunction) => {
  if (req.role && (req.role as string) === "admin") {
    req.role = "ADMIN" as any;
  }
  next();
});

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

// POST /enrollments - Admin tạo enrollment cho student
enrollmentRoutes.post(
  "/",
  authorize(Role.ADMIN),
  createEnrollmentHandler
);

// POST /enrollments/enroll - Student tự enroll vào course
enrollmentRoutes.post(
  "/enroll",
  authorize(Role.STUDENT),
  enrollSelfHandler
);

export default enrollmentRoutes;

