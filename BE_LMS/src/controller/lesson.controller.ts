import { catchErrors } from "../utils/asyncHandler";
import { CreateLessonSchema, LessonByIdSchema, LessonQuerySchema } from "../validators/lesson.schemas";
import { OK } from "../constants/http";
import { createLessonService, deleteLessonService, getLessonById, getLessons, updateLessonService } from "@/services/lesson.service";

// GET /lesson/listAllLessons - List lessons with filters, search, pagination (auth required)
export const listAllLessons = catchErrors(async (req, res) => {
    const queryParams = LessonQuerySchema.parse(req.query);
    
    // Get user info from authentication middleware
    const userId = req.userId;
    const userRole = req.role;
    
    const result = await getLessons(queryParams, userId, userRole);
    
    return res.success(OK, {
        data: result.lessons,
        message: "Get all lessons successfully",
        pagination: result.pagination,
    });
});
// GET /lesson/getLessonById/:id - Get a lesson by id with access control (auth required)
export const getLessonByIdController = catchErrors(async (req, res) => {
    const { id } = req.params;
    
    const validatedParams = LessonByIdSchema.parse({ id });
    
    // Get user info from authentication middleware
    const userId = req.userId;
    const userRole = req.role;
    
    const lesson = await getLessonById(validatedParams.id, userId, userRole);
      
    return res.success(OK, {
        data: lesson,
        message: "Get lesson by id successfully",
    });
});

// POST /lesson/createLessons - Create a lesson (teacher/admin)
export const createLesson = catchErrors(async (req, res) => {
    const data = CreateLessonSchema.parse(req.body);
    
    // Get user info from authentication middleware
    const userId = req.userId;
    const userRole = req.role;
    
    const lesson = await createLessonService(data, userId, userRole);
    return res.success(OK, {
        data: lesson,
        message: "Create lesson successfully",
    });
});

// DELETE /lesson/deleteLessons/:id - Delete a lesson (teacher/admin)
export const deleteLesson = catchErrors(async (req, res) => {
    const { id } = req.params;

    const validatedParams = LessonByIdSchema.parse({ id });

    // Get user info from authentication middleware
    const userId = req.userId;
    const userRole = req.role;

    const lesson = await deleteLessonService(validatedParams.id, userId, userRole);
    
    return res.success(OK, {
        data: lesson,
        message: "Delete lesson successfully",
    });
});

// PUT /lesson/updateLessons/:id - Update a lesson (teacher/admin)
export const updateLesson = catchErrors(async (req, res) => {
    const { id } = req.params;
    const validatedParams = LessonByIdSchema.parse({ id });
    const data = CreateLessonSchema.partial().parse(req.body);
    
    // Get user info from authentication middleware
    const userId = req.userId;

    
    const userRole = req.role;
    
    const result = await updateLessonService(validatedParams.id, data, userId, userRole);
    return res.success(OK, {
        data: result,
        message: "Update lesson successfully",
    });
});