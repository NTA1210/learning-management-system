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
} from "../services/course.service";

export const listCoursesHandler = catchErrors(async (req, res) => {
  // Validate query parameters
  const query = listCoursesSchema.parse(req.query);

  // Call service
  const result = await listCourses({
    page: query.page,
    limit: query.limit,
    search: query.search,
    category: query.category,
    teacherId: query.teacherId,
    code: query.code,
    isPublished: query.isPublished,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return res.success(OK, result.courses, "Courses retrieved successfully", {
    pagination: result.pagination,
  });
});

export const getCourseByIdHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Call service
  const course = await getCourseById(courseId);

  return res.success(OK, course, "Course retrieved successfully");
});

export const createCourseHandler = catchErrors(async (req, res) => {
  // Validate request body
  const data = createCourseSchema.parse(req.body);

  // Call service
  const course = await createCourse(data);

  return res.success(CREATED, course, "Course created successfully");
});

export const updateCourseHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Validate request body
  const data = updateCourseSchema.parse(req.body);

  // Get userId from request (set by authenticate middleware)
  const userId = (req as any).userId;

  // Call service
  const course = await updateCourse(courseId, data, userId);

  return res.success(OK, course, "Course updated successfully");
});

// DELETE /courses/:id - Delete course
export const deleteCourseHandler = catchErrors(async (req, res) => {
  const courseId = courseIdSchema.parse(req.params.id);
  const userId = (req as any).userId; // Extract userId from authenticate middleware

  const result = await deleteCourse(courseId, userId);

  return res.success(OK, null, result.message);
});

