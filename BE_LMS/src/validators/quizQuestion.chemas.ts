import z from "zod";

export const importQuizQuestionParamsSchema = z.object({
  file: z.any(),
  courseId: z.string().length(24, "Invalid course ID"),
});
