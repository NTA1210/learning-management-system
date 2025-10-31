import { catchErrors } from "../utils/asyncHandler";
import { CreateLessonSchema, LessonByCourseSchema, LessonByIdSchema, LessonQuerySchema } from "../validators/lesson.schemas";
import { OK } from "../constants/http";
import { createLessonService, deleteLessonService, getLessonById, getLessons, getLessonsByCourse, updateLessonService } from "@/services/lesson.service";

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

export const createLesson = catchErrors(async (req, res) => {
    const data = CreateLessonSchema.parse(req.body);
    
    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    
    const lesson = await createLessonService(data, userId);
    return res
    .success(OK, lesson, "Create lesson successfully");
});

export const deleteLesson = catchErrors(async (req, res) => {
    const { id } = req.params;

    const validatedParams = LessonByIdSchema.parse({ id });

    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    const userRole = req.role;

    const lesson = await deleteLessonService(validatedParams.id, userId, userRole);
    
    return res
    .success(OK, lesson, "Delete lesson successfully");
    
});

export const updateLesson = catchErrors(async (req, res) => {
    const { id } = req.params;
    const validatedParams = LessonByIdSchema.parse({ id });
    const data = CreateLessonSchema.partial().parse(req.body);
    
    // Get user info from authentication middleware
    const userId = req.userId?.toString();
    const userRole = req.role;
    
    const result = await updateLessonService(validatedParams.id, data, userId, userRole);
    return res
    .success(OK, result, "Update lesson successfully");
});