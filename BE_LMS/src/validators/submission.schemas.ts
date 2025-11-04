import z from "zod";

export const submissionParamsSchema = z.object({
  assignmentId: z.string().min(1, "assignmentId is required"),
});

export const submissionBodySchema = z.object({
  key: z.string().min(1, "key is required"), // MinIO storage key
  originalName: z.string().min(1, "originalName is required"),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

export const gradeSubmissionSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  grade: z.number().min(0, "grade must be >= 0"),
  feedback: z.string().optional(),
});