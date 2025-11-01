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
} from "../validators/enrollment.schemas";
import {
  getEnrollmentById,
  getStudentEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  createEnrollment,
  updateEnrollment,
  updateSelfEnrollment,
} from "../services/enrollment.service";

// GET /enrollments/:id - Get enrollment by ID
export const getEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID format

  const enrollment = await getEnrollmentById(id); // No userId passed
  return res.success(OK, enrollment);
});

// GET /enrollments/my-enrollments - Get all enrollments for the authenticated student
export const getMyEnrollmentsHandler = catchErrors(async (req, res) => {
  const studentId = req.userId!.toString(); // userId from authenticate middleware
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId, // Pass studentId for filtering
    ...filters,
  });
  return res.success(OK, result);
});

// GET /enrollments/student/:studentId - Get all enrollments for a specific student
export const getStudentEnrollmentsHandler = catchErrors(async (req, res) => {
  const { studentId } = studentIdSchema.parse(req.params); // Validate studentId format
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getStudentEnrollments({
    studentId,
    ...filters,
  });
  return res.success(OK, result);
});

// GET /enrollments/course/:courseId - Get all enrollments for a specific course
export const getCourseEnrollmentsHandler = catchErrors(async (req, res) => {
  const { courseId } = courseIdSchema.parse(req.params); // Validate courseId format
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getCourseEnrollments({
    courseId,
    ...filters,
  });
  return res.success(OK, result);
});

// GET /enrollments - Get all enrollments (admin view with filters)
export const getAllEnrollmentsHandler = catchErrors(async (req, res) => {
  const filters = getEnrollmentsQuerySchema.parse(req.query);

  const result = await getAllEnrollments(filters); // No userId passed
  return res.success(OK, result);
});

// POST /enrollments - Admin tạo enrollment cho student
export const createEnrollmentHandler = catchErrors(async (req, res) => {
  const data = createEnrollmentSchema.parse(req.body); // Validate body

  // Admin creates enrollment → default approved if no status specified
  const enrollment = await createEnrollment({
    ...data,
    status: data.status || "approved",
  });
  return res.success(CREATED, enrollment, "Enrollment created successfully");
});

// POST /enrollments/enroll - Student tự enroll vào course
export const enrollSelfHandler = catchErrors(async (req, res) => {
  const { courseId, role, password } = enrollSelfSchema.parse(req.body); // Validate body
  const studentId = req.userId!.toString(); // Lấy từ authenticate middleware

  const enrollment = await createEnrollment({
    studentId,
    courseId,
    role,
    method: "self", // Student tự enroll
    password, // Pass password for password-protected courses
  });
  return res.success(CREATED, enrollment, "Enrolled successfully");
});

// PUT /enrollments/:id - Admin/Teacher update enrollment
export const updateEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID
  const data = updateEnrollmentSchema.parse(req.body); // Validate body

  const enrollment = await updateEnrollment(id, data);
  return res.success(OK, enrollment, "Enrollment updated successfully");
});

// PUT /enrollments/my-enrollments/:id - Student update own enrollment
export const updateSelfEnrollmentHandler = catchErrors(async (req, res) => {
  const { id } = enrollmentIdSchema.parse(req.params); // Validate ID
  const data = updateSelfEnrollmentSchema.parse(req.body); // Validate body
  const studentId = req.userId!.toString(); // Lấy từ authenticate middleware

  const enrollment = await updateSelfEnrollment(id, studentId, data);
  return res.success(OK, enrollment, "Enrollment updated successfully");
});
