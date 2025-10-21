import { z } from "zod";

// GET - Query enrollments
export const getEnrollmentsQuerySchema = z.object({
  status: z.enum(["active", "completed", "dropped"]).optional(),
  courseId: z.string().optional(),
  studentId: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
});

