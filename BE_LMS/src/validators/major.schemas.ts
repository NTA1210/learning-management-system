import z from "zod";

// Schema for listing majors with pagination and filters
export const listMajorsSchema = z.object({
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
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    sortBy: z.enum(["createdAt", "title", "updatedAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListMajorsQuery = z.infer<typeof listMajorsSchema>;

// Schema for creating a major
export const createMajorSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    slug: z.string().min(1, "Slug is required").max(255).optional(),
    description: z.string().optional(),
});

export type CreateMajorInput = z.infer<typeof createMajorSchema>;

// Schema for updating a major
export const updateMajorSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
});

export type UpdateMajorInput = z.infer<typeof updateMajorSchema>;

// Schema for major ID param
export const majorIdSchema = z.string().min(1, "Major ID is required");

export const majorSlugSchema = z.string().min(1, "Major slug is required");

