import { z } from "zod";

// Validate MongoDB ObjectId format (24 ký tự hex)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format. Must be a valid MongoDB ObjectId",
});

// GET - Query enrollments (cho các query params)
export const getEnrollmentsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled", "dropped", "completed"]).optional(),
  courseId: z.string().optional(),
  studentId: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
});

// Validate ID trong URL params
export const enrollmentIdSchema = z.object({
  id: objectIdSchema,
});

export const studentIdSchema = z.object({
  studentId: objectIdSchema,
});

export const courseIdSchema = z.object({
  courseId: objectIdSchema,
});

// POST - Admin tạo enrollment cho student
export const createEnrollmentSchema = z.object({
  studentId: objectIdSchema,
  courseId: objectIdSchema,
  status: z.enum(["pending", "approved", "rejected", "cancelled", "dropped", "completed"]).optional(),
  role: z.enum(["student", "auditor"]).optional(),
  method: z.enum(["self", "invited", "password", "other"]).optional(),
  note: z.string().optional(),
});

// POST - Student tự enroll vào course
export const enrollSelfSchema = z.object({
  courseId: objectIdSchema,
  role: z.enum(["student", "auditor"]).optional(),
  password: z.string().min(1).optional(), // For password-protected courses
});

// PUT - Update enrollment (Admin/Teacher)
export const updateEnrollmentSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled", "dropped", "completed"]).optional(),
  role: z.enum(["student", "auditor"]).optional(),
  finalGrade: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
  respondedBy: objectIdSchema.optional(),
});

// PUT - Student update own enrollment (chỉ có thể drop)
export const updateSelfEnrollmentSchema = z.object({
  status: z.enum(["dropped"]).optional(),
});
