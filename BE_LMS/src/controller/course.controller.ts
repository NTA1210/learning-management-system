import { catchErrors } from "../utils/asyncHandler";
import { OK } from "../constants/http";
import { listCoursesSchema } from "../validators/course.schemas";
import { listCourses } from "../services/course.service";

export const listCoursesHandler = catchErrors(async (req, res) => {
  // Validate query parameters
  const query = listCoursesSchema.parse(req.query);

  // Call service
  const result = await listCourses({
    page: query.page,
    limit: query.limit,
    search: query.search,
    category: query.category,
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

