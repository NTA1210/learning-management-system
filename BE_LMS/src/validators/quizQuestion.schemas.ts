import z from "zod";
import { listParamsSchema } from "./listParams.schema";
import { ListParams } from "@/types/dto";
import { QuizQuestionType } from "@/types/quizQuestion.type";

export const subjectIdSchema = z.string().length(24, "Invalid subject ID");
export const importQuizQuestionParamsSchema = z.object({
  file: z.any(),
  subjectId: subjectIdSchema,
});

interface IListQuizQuestionParams extends ListParams {
  subjectId?: string;
  type?: QuizQuestionType;
  from?: Date;
  to?: Date;
}

export const listQuizQuestionSchema = listParamsSchema.extend({
  subjectId: z.string().length(24, "Invalid subject ID").optional(),
  type: z.enum(QuizQuestionType).optional(),
  from: z.date().optional(),
  to: z.date().optional(),
}) satisfies z.ZodType<IListQuizQuestionParams>;
