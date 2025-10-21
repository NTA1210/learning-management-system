import { catchErrors } from "../utils/asyncHandler";
import { OK } from "../constants/http";
import {
  listCoursesSchema,
  courseIdSchema,
} from "../validators/course.schemas";
import {
  listCourses,
  getCourseById,
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

  return res.status(OK).json({
    message: "Courses retrieved successfully",
    data: result.courses,
    pagination: result.pagination,
  });
});

export const getCourseByIdHandler = catchErrors(async (req, res) => {
  // Validate course ID
  const courseId = courseIdSchema.parse(req.params.id);

  // Call service
  const course = await getCourseById(courseId);

  return res.status(OK).json({
    message: "Course retrieved successfully",
    data: course,
  });
});

