import z from "zod";

// Schema for listing courses with pagination and filters
export const listCoursesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    }),
  search: z.string().optional(),
  category: z.string().optional(),
  teacherId: z.string().optional(), // Filter by teacher ID
  code: z.string().optional(), // Filter by course code
  isPublished: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  sortBy: z.enum(["createdAt", "title", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListCoursesQuery = z.infer<typeof listCoursesSchema>;

// Schema for creating a course
export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  category: z.string().optional(), // Category ObjectId
  teachers: z.array(z.string()).min(1, "At least one teacher is required"), // Array of User ObjectIds
  isPublished: z.boolean().optional().default(false),
  capacity: z.number().int().positive().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

// Schema for updating a course
export const updateCourseSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  teachers: z.array(z.string()).min(1).optional(),
  isPublished: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// Schema for course ID param
export const courseIdSchema = z.string().min(1, "Course ID is required");

