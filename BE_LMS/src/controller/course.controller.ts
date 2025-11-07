import { catchErrors } from "../utils/asyncHandler";
import { OK, CREATED } from "../constants/http";
import {
  listCoursesSchema,
  courseIdSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../validators/course.schemas";
import {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
} from "../services/course.service";

/**
 * GET /courses - List all courses with filters
 * Supports soft delete: ?includeDeleted=true or ?onlyDeleted=true (admin only)
 */
export const listCoursesHandler = catchErrors(async (req, res) => {
  // Validate query parameters
  const query = listCoursesSchema.parse(req.query);

  // ✅ FIX: Get user role from request (undefined if not authenticated)
  const userRole = (req as any).role;

  // Call service
  const result = await listCourses({
    page: query.page,
    limit: query.limit,
    search: query.search,
    subjectId: query.subjectId,
    teacherId: query.teacherId,
    isPublished: query.isPublished,
    status: query.status,
    includeDeleted: query.includeDeleted,
    onlyDeleted: query.onlyDeleted,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    userRole, // ✅ FIX: Pass userRole to service for permission check
  });

  return res.success(OK, {
    data: result.courses,
    message: "Courses retrieved successfully",
    pagination: result.pagination,
  });
});

/**
 * GET /courses/:id - Get course by ID
 */
export const getCourseByIdHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Call service
  const course = await getCourseById(courseId);

  return res.success(OK, {
    data: course,
    message: "Course retrieved successfully",
  });
});

/**
 * POST /courses - Create new course
 */
export const createCourseHandler = catchErrors(async (req, res) => {
  // Get logo file from multer (if uploaded)
  const logoFile = req.file;

  // Validate request body
  const data = createCourseSchema.parse(req.body);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service with logo file
  const course = await createCourse(data, userId, logoFile);

  return res.success(CREATED, {
    data: course,
    message: "Course created successfully",
  });
});

/**
 * PUT /courses/:id - Update course
 */
export const updateCourseHandler = catchErrors(async (req, res) => {
  // Get logo file from multer (if uploaded)
  const logoFile = req.file;

  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Validate request body
  const data = updateCourseSchema.parse(req.body);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service with logo file
  const course = await updateCourse(courseId, data, userId, logoFile);
  
  return res.success(OK, {
    data: course,
    message: "Course updated successfully",
  });
});

/**
 * DELETE /courses/:id - Soft delete course
 */
export const deleteCourseHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service
  const result = await deleteCourse(courseId, userId);

  return res.success(OK, {
    data: null,
    message: result.message,
  });
});

/**
 * POST /courses/:id/restore - Restore deleted course (Admin only)
 */
export const restoreCourseHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service
  const result = await restoreCourse(courseId, userId);

  return res.success(OK, {
    data: result.course,
    message: result.message,
  });
});

/**
 * DELETE /courses/:id/permanent - Permanently delete course from database (Admin only)
 * ⚠️ WARNING: This action CANNOT be undone!
 */
export const permanentDeleteCourseHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service
  const result = await permanentDeleteCourse(courseId, userId);

  return res.success(OK, {
    data: null,
    message: result.message,
    warning: result.warning,
    deletedCourseId: result.deletedCourseId,
  });
});
