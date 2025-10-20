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

