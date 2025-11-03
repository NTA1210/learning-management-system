import z from "zod";
import { CourseStatus } from "../types/course.type";

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
  specialistId: z.string().optional(), // Filter by specialist ID
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
  status: z
    .enum([CourseStatus.DRAFT, CourseStatus.ONGOING, CourseStatus.COMPLETED])
    .optional(), // Filter by status
  // ✅ SOFT DELETE: Admin can view deleted courses
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }), // Admin only - show deleted courses
  onlyDeleted: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      return false;
    }), // Admin only - show only deleted courses
  sortBy: z
    .enum(["createdAt", "title", "updatedAt", "startDate", "endDate", "deletedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ListCoursesQuery = z.infer<typeof listCoursesSchema>;

// Schema for creating a course
export const createCourseSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    code: z.string().min(1).max(50).optional(),
    logo: z.string().optional(), // URL to logo image
    description: z.string().optional(),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .transform((val) => new Date(val)), // Required
    endDate: z
      .string()
      .min(1, "End date is required")
      .transform((val) => new Date(val)), // Required
    status: z
      .enum([CourseStatus.DRAFT, CourseStatus.ONGOING, CourseStatus.COMPLETED])
      .optional()
      .default(CourseStatus.DRAFT),
    teacherIds: z
      .array(z.string())
      .min(1, "At least one teacher is required"), // Required
    specialistIds: z.array(z.string()).optional(), // Optional
    isPublished: z.boolean().optional().default(false),
    capacity: z.number().int().positive().optional(),
    enrollRequiresApproval: z.boolean().optional().default(false),
    enrollPasswordHash: z.string().optional(), // Pre-hashed password
    meta: z.record(z.string(), z.any()).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

// Schema for updating a course
export const updateCourseSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
    logo: z.string().optional(),
    description: z.string().optional(),
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    status: z
      .enum([CourseStatus.DRAFT, CourseStatus.ONGOING, CourseStatus.COMPLETED])
      .optional(),
    teacherIds: z.array(z.string()).min(1).optional(),
    specialistIds: z.array(z.string()).optional(),
    isPublished: z.boolean().optional(),
    capacity: z.number().int().positive().optional(),
    enrollRequiresApproval: z.boolean().optional(),
    enrollPasswordHash: z.string().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, endDate must be after startDate
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// Schema for course ID param
export const courseIdSchema = z.string().min(1, "Course ID is required");
