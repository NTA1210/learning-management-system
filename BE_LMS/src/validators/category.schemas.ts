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

// Schema for creating a category
export const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    slug: z.string().min(1, "Slug is required").max(255),
    description: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Schema for updating a category
export const updateCategorySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Schema for course ID param
export const categoryIdSchema = z.string().min(1, "Category ID is required");

export const categorySlugSchema = z.string().min(1, "Category slug is required");