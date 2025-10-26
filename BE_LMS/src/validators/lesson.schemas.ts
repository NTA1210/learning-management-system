import z from "zod";

export const CreateLessonSchema = z.object({
    title: z.string().min(1).max(255),
    courseId: z.string().min(1),
    content: z.string().optional(),
    order: z.number().optional(),
    durationMinutes: z.number().optional(),
    publishedAt: z.coerce.date().optional(),
});

export const LessonQuerySchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    order: z.coerce.number().optional(),
    durationMinutes: z.coerce.number().optional(),
    publishedAt: z.coerce.date().optional(),
    courseId: z.string().optional(),
    search: z.string().optional(), // For full-text search
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

export const LessonByIdSchema = z.object({
    id: z.string().min(1, "ID is required"),
});

export const LessonByCourseSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
});

export type CreateLessonParams = z.infer<typeof CreateLessonSchema>;
export type LessonQueryParams = z.infer<typeof LessonQuerySchema>;
export type LessonByIdParams = z.infer<typeof LessonByIdSchema>;
export type LessonByCourseParams = z.infer<typeof LessonByCourseSchema>;