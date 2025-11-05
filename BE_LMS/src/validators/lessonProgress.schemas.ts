import z from "zod";

// Schema for getting lesson progress
export const GetLessonProgressSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  studentId: z.string().optional(), // Optional query param for teacher/admin
});

// Schema for adding time to lesson (body only, lessonId comes from params)
export const AddTimeForLessonBodySchema = z.object({
  incSeconds: z.coerce
    .number()
    .refine((val) => !isNaN(val) && val !== null && val !== undefined, {
      message: "incSeconds is required and must be a valid number",
    })
    .refine((val) => Number.isInteger(val), {
      message: "incSeconds must be an integer",
    })
    .refine((val) => val >= 1, {
      message: "incSeconds must be at least 1 second",
    })
    .refine((val) => val <= 300, {
      message: "Time increment must be between 1 and 300 seconds",
    }),
});

// Schema for lessonId validation (from params)
export const LessonIdParamSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
});

// Schema for completing lesson (lessonId from params, no body needed)

// Schema for getting course progress
export const GetCourseProgressSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  studentId: z.string().optional(), // Optional query param for teacher/admin
});

// Export types
export type GetLessonProgressParams = z.infer<typeof GetLessonProgressSchema>;
export type AddTimeForLessonBody = z.infer<typeof AddTimeForLessonBodySchema>;
export type LessonIdParam = z.infer<typeof LessonIdParamSchema>;
export type GetCourseProgressParams = z.infer<typeof GetCourseProgressSchema>;

