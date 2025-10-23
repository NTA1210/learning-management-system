import z from "zod";

// Common ID schema
export const assignmentIdSchema = z.string().min(1, "Assignment ID is required");

// List schema with pagination and optional filters
export const listAssignmentsSchema = z.object({
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
  courseId: z.string().optional(),
  search: z.string().optional(),
  dueBefore: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  dueAfter: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  sortBy: z.enum(["createdAt", "dueDate", "title", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsSchema>;

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  createdBy: z.string().optional(),
  maxScore: z.number().int().positive().optional().default(100),
  dueDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  allowLate: z.boolean().optional().default(false),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  maxScore: z.number().int().positive().optional(),
  dueDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  allowLate: z.boolean().optional(),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;



