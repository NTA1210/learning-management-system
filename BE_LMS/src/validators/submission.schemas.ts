import z from "zod";

export const submissionParamsSchema = z.object({
  assignmentId: z.string().length(24,"Assignment Id is invalid"),
});

export const submissionBodySchema = z
  .object({
    assignmentId:z.string().length(24,"Assignment Id is invalid"),
    studentId:z.string().length(24,"Student Id is invalid"),
    file:z.any()
  })
  

export const gradeSubmissionSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  grade: z.number().min(0, "grade must be >= 0"),
  feedback: z.string().optional(),
});