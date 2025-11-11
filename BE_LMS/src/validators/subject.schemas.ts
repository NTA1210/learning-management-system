import z from "zod";

export const listSubjectsSchema = z.object({
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
  code: z.string().optional(),
  specialistId: z.string().optional(),
  isActive: z.union([z.string(), z.boolean()]).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "code"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListSubjectsQuery = z.infer<typeof listSubjectsSchema>;

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(64),
  credits: z.number().int().min(0).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).max(255).optional(),
  specialistIds: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional().default([]),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(64).optional(),
  credits: z.number().int().min(0).max(100).optional(),
  description: z.string().optional(),
  slug: z.string().min(1).max(255).optional(),
  specialistIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

export const subjectIdSchema = z.string().min(1, "Subject ID is required");
export const subjectSlugSchema = z.string().min(1, "Subject slug is required");

// Activate/Deactivate
export const subjectActivateSchema = z.object({ id: z.string().min(1) });

// Prerequisites
export const addPrerequisitesSchema = z.object({
  subjectId: z.string().min(1),
  prerequisiteIds: z.array(z.string().min(1)).min(1),
});

export const removePrerequisiteSchema = z.object({
  subjectId: z.string().min(1),
  prerequisiteId: z.string().min(1),
});

export const listPrerequisitesSchema = z.object({ subjectId: z.string().min(1) });

// Autocomplete
export const autocompleteSchema = z.object({
  q: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => v > 0 && v <= 50, { message: "limit in (1..50)" }),
});

// Related
export const relatedSubjectsSchema = z.object({
  id: z.string().min(1),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => v > 0 && v <= 50, { message: "limit in (1..50)" }),
});



