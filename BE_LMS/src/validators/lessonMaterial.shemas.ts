import z from "zod";

// Material types enum (only original types)
const MaterialTypeEnum = z.enum(["pdf", "video", "ppt", "link", "other"]);

// Query schema for filtering materials
export const LessonMaterialQuerySchema = z.object({
  title: z.string().optional(),
  type: MaterialTypeEnum.optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
  uploadedBy: z.string().optional(),
  lessonId: z.string().min(1).optional(),
  search: z.string().optional(), // For full-text search
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Schema for creating lesson material
export const CreateLessonMaterialSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  type: MaterialTypeEnum.default("other"),
  fileUrl: z.string().url("Invalid URL format").optional(),
  fileName: z.string().max(255, "File name too long").optional(),
  sizeBytes: z.number().int().positive("File size must be positive").optional(),
});

// Schema for updating lesson material
export const UpdateLessonMaterialSchema = CreateLessonMaterialSchema.partial().omit({ lessonId: true });

// Schema for getting material by ID
export const LessonMaterialByIdSchema = z.object({
  id: z.string().min(1, "Material ID is required"),
});

// Schema for getting materials by lesson
export const LessonMaterialsByLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
});

// Schema for file upload
export const UploadMaterialSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  type: MaterialTypeEnum.default("other"),
});

// Export types
export type LessonMaterialQueryParams = z.infer<typeof LessonMaterialQuerySchema>;
export type CreateLessonMaterialParams = z.infer<typeof CreateLessonMaterialSchema>;
export type UpdateLessonMaterialParams = z.infer<typeof UpdateLessonMaterialSchema>;
export type LessonMaterialByIdParams = z.infer<typeof LessonMaterialByIdSchema>;
export type LessonMaterialsByLessonParams = z.infer<typeof LessonMaterialsByLessonSchema>;
export type UploadMaterialParams = z.infer<typeof UploadMaterialSchema>;