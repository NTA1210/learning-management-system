import z from "zod";

export const submissionParamsSchema = z.object({
  assignmentId: z.string().min(1, "assignmentId is required"),
});

export const submissionBodySchema = z.object({
  fileUrl: z.string().url("fileUrl must be a valid URL"),
  fileName: z.string().optional(),
});