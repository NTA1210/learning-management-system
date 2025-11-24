import z from 'zod';
import { AttendanceStatus } from '@/types/attendance.type';
import { datePreprocess } from './helpers/date.schema';

/* ----------------------------------------------------
 *  Reusable Base Schemas
 * -------------------------------------------------- */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const attendanceStatusSchema = z.enum([
  AttendanceStatus.NOTYET,
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
] as const);

/* ----------------------------------------------------
 *  Params Schemas
 * -------------------------------------------------- */
export const AttendanceIdParamSchema = z.object({
  attendanceId: objectIdSchema,
});

export const LessonIdParamSchema = z.object({
  lessonId: objectIdSchema,
});

export const CourseIdParamSchema = z.object({
  courseId: objectIdSchema,
});

export const StudentIdParamSchema = z.object({
  studentId: objectIdSchema,
});

/* ----------------------------------------------------
 *  Attendance Entry / Create / Update
 * -------------------------------------------------- */
export const attendanceEntrySchema = z.object({
  studentId: objectIdSchema,
  status: attendanceStatusSchema,
});

export const markAttendanceSchema = z.object({
  courseId: objectIdSchema,
  date: datePreprocess,
  entries: z.array(attendanceEntrySchema).nonempty(),
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusSchema.optional(),
  reason: z
    .string()
    .trim()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long')
    .optional(),
  // Optional: Nếu muốn update nhiều records, truyền array of IDs trong body
  attendanceIds: z
    .array(objectIdSchema)
    .min(1, "At least one attendance ID is required")
    .max(100, "Cannot update more than 100 records at once")
    .optional(),
  // Optional: Chỉ trả về IDs thay vì full records để giảm payload
  returnIdsOnly: z.boolean().optional().default(false),
});

/* ----------------------------------------------------
 *  Pagination
 * -------------------------------------------------- */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().min(1).max(1000)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().min(1).max(200)),
});

/* ----------------------------------------------------
 *  Date Range Base (không refine ở đây)
 * -------------------------------------------------- */
export const dateRangeBaseSchema = z.object({
  from: datePreprocess.optional(),
  to: datePreprocess.optional(),
});

/* ----------------------------------------------------
 *  Query Schemas
 * -------------------------------------------------- */

/* List Attendance */
export const listAttendanceQuerySchema = paginationSchema
  .safeExtend({
    courseId: objectIdSchema.optional(),
    studentId: objectIdSchema.optional(),
    teacherId: objectIdSchema.optional(),
    status: attendanceStatusSchema.optional(),
    sortBy: z.enum(['date', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .merge(dateRangeBaseSchema)
  .refine((v) => !(v.from && v.to) || v.from <= v.to, {
    message: 'from must be before to',
    path: ['to'],
  });

/* Student History */
export const studentHistoryQuerySchema = paginationSchema
  .safeExtend({
    courseId: objectIdSchema.optional(),
    status: attendanceStatusSchema.optional(),
  })
  .merge(dateRangeBaseSchema)
  .refine((v) => !(v.from && v.to) || v.from <= v.to, {
    message: 'from must be before to',
    path: ['to'],
  });

export const selfHistoryQuerySchema = studentHistoryQuerySchema;

/* ----------------------------------------------------
 *  Export Attendance
 * -------------------------------------------------- */
export const exportAttendanceQuerySchema = listAttendanceQuerySchema.safeExtend({
  format: z.enum(['csv', 'json']).default('csv').optional(),
});

/* ----------------------------------------------------
 *  Course Stats
 * -------------------------------------------------- */
export const courseStatsQuerySchema = dateRangeBaseSchema
  .safeExtend({
    threshold: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20))
      .pipe(z.number().min(5).max(100)),
  })
  .refine((v) => !(v.from && v.to) || v.from <= v.to, {
    message: 'from must be before to',
    path: ['to'],
  });

/* ----------------------------------------------------
 *  Lesson Template
 * -------------------------------------------------- */
export const lessonTemplateSchema = z.object({
  lessonDate: datePreprocess.optional(),
  force: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (typeof v === 'string' ? v === 'true' : Boolean(v))),
});
/* ----------------------------------------------------
 *  Send Absence Notification Emails
 * -------------------------------------------------- */
export const sendAbsenceNotificationSchema = z.object({
  studentIds: z
    .array(objectIdSchema)
    .min(1, "At least one student ID is required")
    .max(100, "Cannot send emails to more than 100 students at once"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type ListAttendanceInput = z.infer<typeof listAttendanceQuerySchema>;
export type StudentHistoryInput = z.infer<typeof studentHistoryQuerySchema>;
export type CourseStatsInput = z.infer<typeof courseStatsQuerySchema>;
export type ExportAttendanceInput = z.infer<typeof exportAttendanceQuerySchema>;
export type SendAbsenceNotificationInput = z.infer<typeof sendAbsenceNotificationSchema>;


