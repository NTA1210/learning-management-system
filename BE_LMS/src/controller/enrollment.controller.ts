import { OK } from "../constants/http";
import { catchErrors } from "../utils/asyncHandler";
import { getEnrollmentsQuerySchema } from "../validators/enrollment.schemas";
import {
  getEnrollmentById,
  getStudentEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
} from "../services/enrollment.service";

// GET /enrollments/:id - Get enrollment by ID
export const getEnrollmentHandler = catchErrors(async (req, res) => {
  const userId = req.userId!.toString();
  const { id } = req.params;

  const enrollment = await getEnrollmentById(id, userId);

  return res.success(OK, enrollment);
});

// GET /enrollments/my-enrollments - Get all enrollments for the authenticated student
export const getMyEnrollmentsHandler = catchErrors(async (req, res) => {
  const userId = req.userId!.toString();
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId: userId,
    requestUserId: userId,
    ...filters,
  });

  return res.success(OK, result);
});

// GET /enrollments/student/:studentId - Get all enrollments for a specific student
export const getStudentEnrollmentsHandler = catchErrors(async (req, res) => {
  const userId = req.userId!.toString();
  const { studentId } = req.params;
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId,
    requestUserId: userId,
    ...filters,
  });

  return res.success(OK, result);
});

// GET /enrollments/course/:courseId - Get all enrollments for a specific course
export const getCourseEnrollmentsHandler = catchErrors(async (req, res) => {
  const userId = req.userId!.toString();
  const { courseId } = req.params;
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getCourseEnrollments({
    courseId,
    requestUserId: userId,
    ...filters,
  });

  return res.success(OK, result);
});

// GET /enrollments - Get all enrollments (admin view with filters)
export const getAllEnrollmentsHandler = catchErrors(async (req, res) => {
  const userId = req.userId!.toString();
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getAllEnrollments({
    requestUserId: userId,
    ...filters,
  });

  return res.success(OK, result);
});

