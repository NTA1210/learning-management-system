import { catchErrors } from '../utils/asyncHandler';
import { OK, CREATED } from '../constants/http';
import {
  listCoursesSchema,
  courseIdSchema,
  createCourseSchema,
  updateCourseSchema,
  getQuizzesSchema,
} from '../validators/course.schemas';
import {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
  getMyCourses,
  getQuizzes,
  getCourseBySlug,
  completeCourse,
  getCourseStatistics,
} from '../services/course.service';
import { parseFormData } from '../utils/parseFormData';

/**
 * GET / courses / my - courses - Get my courses
 */
export const getMyCoursesHandler = catchErrors(async (req, res) => {
  const query = listCoursesSchema.parse(req.query);
  const userId = (req as any).userId;
  const userRole = (req as any).role;

  const result = await getMyCourses({
    userId,
    userRole,
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search,
      slug: query.slug,
      from: query.from,
      to: query.to,
      subjectId: query.subjectId,
      semesterId: query.semesterId,
      teacherId: query.teacherId,
      isPublished: query.isPublished,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });

  return res.success(OK, {
    data: result.courses,
    message: 'My courses retrieved successfully',
    pagination: result.pagination,
  });
});

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
    slug: query.slug,
    from: query.from,
    to: query.to,
    subjectId: query.subjectId,
    semesterId: query.semesterId,
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
    message: 'Courses retrieved successfully',
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
    message: 'Course retrieved successfully',
  });
});

/**
 * GET /courses/slug/:slug - Get course by Slug
 */
export const getCourseBySlugHandler = catchErrors(async (req, res) => {
  const slug = req.params.slug;

  // Call service
  const course = await getCourseBySlug(slug);

  return res.success(OK, {
    data: course,
    message: 'Course retrieved successfully',
  });
});

/**
 * POST /courses - Create new course
 */
export const createCourseHandler = catchErrors(async (req, res) => {
  // Get logo file from multer (if uploaded)
  const logoFile = req.file;

  // Parse form-data fields (arrays, objects are sent as JSON strings)
  const parsedBody = parseFormData(req.body);

  // Validate request body
  const data = createCourseSchema.parse(parsedBody);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service with logo file
  const result = await createCourse(data, userId, logoFile);

  return res.success(CREATED, {
    data: result.course,
    message: 'Course created successfully',
    ...(result.warnings.length > 0 && { warnings: result.warnings }),
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

  // Parse form-data fields (arrays, objects are sent as JSON strings)
  const parsedBody = parseFormData(req.body);

  // Validate request body
  const data = updateCourseSchema.parse(parsedBody);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service with logo file
  const result = await updateCourse(courseId, data, userId, logoFile);

  return res.success(OK, {
    data: result.course,
    message: 'Course updated successfully',
    ...(result.warnings.length > 0 && { warnings: result.warnings }),
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

// GET /:courseId/quizzes - Get all quizzes
export const getQuizzesHandler = catchErrors(async (req, res) => {
  const role = req.role;
  const input = getQuizzesSchema.parse(
    parseFormData({ ...req.query, courseId: req.params.courseId })
  );
  const { quizzes, pagination } = await getQuizzes(input, role);

  return res.success(OK, {
    data: quizzes,
    pagination,
    message: 'Quizzes retrieved successfully',
  });
});

// POST /:courseId/statistics - Complete course
export const completeCourseHandler = catchErrors(async (req, res) => {
  const courseId = courseIdSchema.parse(req.params.courseId);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;
  const role = (req as any).role;

  const data = await completeCourse(courseId, userId, role);

  return res.success(OK, {
    data,
    message: 'Course completed successfully',
  });
});

// GET /:courseId/statistics - Get course statistics
export const getCourseStatisticsHandler = catchErrors(async (req, res) => {
  const courseId = courseIdSchema.parse(req.params.courseId);
  const userId = (req as any).userId;
  const role = (req as any).role;

  const data = await getCourseStatistics(courseId, userId, role);

  return res.success(OK, {
    data,
    message: data.statistics ? 'Course statistics retrieved successfully' : data.message,
  });
});
