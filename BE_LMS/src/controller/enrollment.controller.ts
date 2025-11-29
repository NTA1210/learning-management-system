import { OK, CREATED } from "../constants/http";
import { catchErrors } from "../utils/asyncHandler";
import {
  getEnrollmentsQuerySchema,
  enrollmentIdSchema,
  studentIdSchema,
  courseIdSchema,
  createEnrollmentSchema,
  enrollSelfSchema,
  updateEnrollmentSchema,
  updateSelfEnrollmentSchema,
  kickStudentSchema,
} from "../validators/enrollment.schemas";
import {
  getEnrollmentById,
  getStudentEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  createEnrollment,
  updateEnrollment,
  updateSelfEnrollment,
  kickStudentFromCourse,
} from "../services/enrollment.service";
import { EnrollmentStatus, EnrollmentMethod } from "@/types/enrollment.type";

// GET /enrollments/:id - Get enrollment by ID
export const getEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID format

  const enrollment = await getEnrollmentById(id); // No userId passed
  return res.success(OK, { data: enrollment });
});

// GET /enrollments/my-enrollments - Get all enrollments for the authenticated student
export const getMyEnrollmentsHandler = catchErrors(async (req, res) => {
  const studentId = req.userId!; // userId from authenticate middleware
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId, // Pass studentId for filtering
    ...filters,
  });
  return res.success(OK, {
    data: result.enrollments,
    pagination: result.pagination,
  });
});

// GET /enrollments/student/:studentId - Get all enrollments for a specific student
export const getStudentEnrollmentsHandler = catchErrors(async (req, res) => {
  const { studentId } = studentIdSchema.parse(req.params); // Validate studentId format
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId,
    ...filters,
  });
  return res.success(OK, {
    data: result.enrollments,
    pagination: result.pagination,
  });
});

// GET /enrollments/course/:courseId - Get all enrollments for a specific course
export const getCourseEnrollmentsHandler = catchErrors(async (req, res) => {
  const { courseId } = courseIdSchema.parse(req.params); // Validate courseId format
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getCourseEnrollments({
    courseId,
    ...filters,
  });
  return res.success(OK, {
    data: result.enrollments,
    pagination: result.pagination,
  });
});

// GET /enrollments - Get all enrollments (admin view with filters)
export const getAllEnrollmentsHandler = catchErrors(async (req, res) => {
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getAllEnrollments(filters, {
    role: req.role!,
    userId: req.userId!,
  });
  return res.success(OK, {
    data: result.enrollments,
    pagination: result.pagination,
  });
});

// POST /enrollments - Admin tạo enrollment cho student
export const createEnrollmentHandler = catchErrors(async (req, res) => {
  const data = createEnrollmentSchema.parse(req.body); // Validate body

  // Admin creates enrollment → default approved if no status specified
  const enrollment = await createEnrollment({
    ...data,
    status: data.status || EnrollmentStatus.APPROVED,
    method: data.method || EnrollmentMethod.OTHER, // Default to OTHER for admin/teacher to bypass anti-spam
  });
  return res.success(CREATED, { data: enrollment, message: "Enrollment created successfully" });
});

// POST /enrollments/enroll - Student tự enroll vào course
export const enrollSelfHandler = catchErrors(async (req, res) => {
  const { courseId, role, password } = enrollSelfSchema.parse(req.body); // Validate body
  const studentId = req.userId!; // Lấy từ authenticate middleware

  const enrollment = await createEnrollment({
    studentId,
    courseId,
    role,
    method: EnrollmentMethod.SELF, // Student tự enroll
    password, // Pass password for password-protected courses
  });
  return res.success(CREATED, { data: enrollment, message: "Enrolled successfully" });
});

// PUT /enrollments/:id - Admin/Teacher update enrollment
export const updateEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID
  const data = updateEnrollmentSchema.parse(req.body); // Validate body

  const enrollment = await updateEnrollment(id, data);
  return res.success(OK, { data: enrollment, message: "Enrollment updated successfully" });
});

// PUT /enrollments/my-enrollments/:id - Student update own enrollment
export const updateSelfEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID
  const data = updateSelfEnrollmentSchema.parse(req.body); // Validate body
  const studentId = req.userId!; // Lấy từ authenticate middleware

  const enrollment = await updateSelfEnrollment(id, studentId, data);
  return res.success(OK, { data: enrollment, message: "Enrollment updated successfully" });
});

// POST /enrollments/:id/kick - Kick student from course
export const kickStudentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params);
  const { reason } = kickStudentSchema.parse(req.body);
  const userId = req.userId!;
  const userRole = req.role!;

  const result = await kickStudentFromCourse(id, reason, userId, userRole);

  return res.success(OK, {
    message: result.message,
  });
});

