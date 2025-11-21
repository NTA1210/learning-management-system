import { z } from "zod";
import { datePreprocess } from "./helpers/date.schema";
import {
  EnrollmentStatus,
  EnrollmentRole,
  EnrollmentMethod,
} from "../types/enrollment.type";

// Validate MongoDB ObjectId format (24 ký tự hex)
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: "Invalid ID format. Must be a valid MongoDB ObjectId",
});

// GET - Query enrollments (cho các query params)
export const getEnrollmentsQuerySchema = z
  .object({
    status: z.enum(EnrollmentStatus).optional(),
    courseId: z.string().optional(),
    studentId: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    from: datePreprocess.optional(),
    to: datePreprocess.optional(),
  })
  .refine(
    (val) => {
      if (val.from && val.to) {
        return val.from.getTime() <= val.to.getTime();
      }
      return true;
    },
    {
      message: "From date must be less than or equal to To date",
      path: ["to"],
    }
  );

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
  status: z
    .enum([EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED] as const)
    .optional(),
  role: z
    .enum([EnrollmentRole.STUDENT, EnrollmentRole.AUDITOR] as const)
    .optional(),
  method: z
    .enum([
      EnrollmentMethod.SELF,
      EnrollmentMethod.INVITED,
      EnrollmentMethod.PASSWORD,
      EnrollmentMethod.OTHER,
    ] as const)
    .optional(),
  note: z.string().optional(),
});

// POST - Student tự enroll vào course
export const enrollSelfSchema = z.object({
  courseId: objectIdSchema,
  role: z
    .enum([EnrollmentRole.STUDENT, EnrollmentRole.AUDITOR] as const)
    .optional(),
  password: z.string().min(1).optional(), // For password-protected courses
});

// PUT - Update enrollment (Admin/Teacher)
export const updateEnrollmentSchema = z.object({
  status: z
    .enum([
      EnrollmentStatus.PENDING,
      EnrollmentStatus.APPROVED,
      EnrollmentStatus.REJECTED,
      EnrollmentStatus.CANCELLED,
      EnrollmentStatus.DROPPED,
      EnrollmentStatus.COMPLETED,
    ] as const)
    .optional(),
  role: z
    .enum([EnrollmentRole.STUDENT, EnrollmentRole.AUDITOR] as const)
    .optional(),
  finalGrade: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
  respondedBy: objectIdSchema.optional(),
});

// PUT - Student update own enrollment (chỉ có thể cancel)
// ⚠️ Student chỉ được phép CANCEL enrollment (tự hủy)
// DROPPED là do Admin/Teacher thực hiện (đánh rớt student)
export const updateSelfEnrollmentSchema = z.object({
  status: z.literal(EnrollmentStatus.CANCELLED).optional(),
});
