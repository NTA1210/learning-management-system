import z from "zod";

// Schema for listing categories with pagination and filters
export const listCategoriesSchema = z.object({
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
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    sortBy: z.enum(["createdAt", "title", "updatedAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>;

// Schema for creating a course
// export const createCategorySchema = z.object({
//     title: z.string().min(1, "Title is required").max(255),
//     code: z.string().min(1).max(50).optional(),
//     description: z.string().optional(),
//     category: z.string().optional(), // Category ObjectId
//     teachers: z.array(z.string()).min(1, "At least one teacher is required"), // Array of User ObjectIds
//     isPublished: z.boolean().optional().default(false),
//     capacity: z.number().int().positive().optional(),
//     meta: z.record(z.string(), z.any()).optional(),
// });

// export type CreateCourseInput = z.infer<typeof createCategorySchema>;

// Schema for updating a course
// export const updateCategorySchema = z.object({
//     title: z.string().min(1).max(255).optional(),
//     code: z.string().min(1).max(50).optional(),
//     description: z.string().optional(),
//     category: z.string().optional(),
//     teachers: z.array(z.string()).min(1).optional(),
//     isPublished: z.boolean().optional(),
//     capacity: z.number().int().positive().optional(),
//     meta: z.record(z.string(), z.any()).optional(),
// });

// export type UpdateCourseInput = z.infer<typeof updateCategorySchema>;

// Schema for course ID param
export const categoryIdSchema = z.string().min(1, "Category ID is required");

export const categorySlugSchema = z.string().min(1, "Category slug is required");