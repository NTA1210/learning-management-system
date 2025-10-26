import { getLessonById, getLessons, getLessonsByCourse } from "../services/lesson.service";
import { catchErrors } from "../utils/asyncHandler";
import { CreateLessonSchema, LessonByIdSchema, LessonQuerySchema, LessonByCourseSchema } from "../validators/lesson.schemas";
import { OK } from "../constants/http";
import { Role } from "../types";

export const listAllLessons = catchErrors(async (req, res) => {
    const queryParams = LessonQuerySchema.parse(req.query);
    
    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    const userRole = req.role;
    
    const result = await getLessons(queryParams, userId, userRole);
    
    return res
    .success(OK, result, "Get all lessons successfully");
});

export const getLessonsByCourseController = catchErrors(async (req, res) => {
    const { courseId } = req.params;
    
    const validatedParams = LessonByCourseSchema.parse({ courseId });
    
    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    const userRole = req.role;
    
    const lessons = await getLessonsByCourse(validatedParams.courseId, userId, userRole);
    
    return res
    .success(OK, lessons, "Get lessons by course successfully");
});

export const getLessonByIdController = catchErrors(async (req, res) => {
    const { id } = req.params;
    
    const validatedParams = LessonByIdSchema.parse({ id });
    
    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    const userRole = req.role;
    
    const lesson = await getLessonById(validatedParams.id, userId, userRole);
      
    return res
    .success(OK, lesson, "Get lesson by id successfully");
});