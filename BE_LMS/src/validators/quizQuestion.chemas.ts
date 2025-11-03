import z from "zod";

export const courseIdSchema = z.string().length(24, "Invalid course ID");
export const importQuizQuestionParamsSchema = z.object({
  file: z.any(),
  courseId: courseIdSchema,
});
