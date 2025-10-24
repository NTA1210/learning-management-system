import { z } from "zod";

// Validate MongoDB ObjectId format (24 ký tự hex)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format. Must be a valid MongoDB ObjectId",
});

// GET - Query enrollments (cho các query params)
export const getEnrollmentsQuerySchema = z.object({
  status: z.enum(["active", "completed", "dropped"]).optional(),
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
  status: z.enum(["active", "completed", "dropped"]).optional(),
  role: z.enum(["student", "auditor"]).optional(),
});

// POST - Student tự enroll vào course
export const enrollSelfSchema = z.object({
  courseId: objectIdSchema,
  role: z.enum(["student", "auditor"]).optional(),
});
