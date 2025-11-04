import z from "zod";
import { listParamsSchema } from "./listParams.schema";
import { ListParams } from "@/types/dto";
import IQuizQuestion, { QuizQuestionType } from "@/types/quizQuestion.type";
import multer from "multer";

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
  subjectId: subjectIdSchema.optional(),
  type: z.enum(QuizQuestionType).optional(),
  from: z.date().optional(),
  to: z.date().optional(),
}) satisfies z.ZodType<IListQuizQuestionParams>;

export interface ICreateQuizQuestionParams {
  subjectId: string;
  text: string;
  image?: Express.Multer.File;
  type?: QuizQuestionType;
  options: string[];
  correctOptions: number[];
  points?: number;
  explanation?: string;
}

export const createQuizQuestionSchema = z.object({
  subjectId: subjectIdSchema,
  text: z.string().min(1, "Text is required"),
  image: z.any().optional(),
  type: z.enum(QuizQuestionType).default(QuizQuestionType.MCQ),
  options: z.array(z.string()).min(2, "At least two options are required"),
  correctOptions: z
    .array(z.number())
    .min(1, "At least one correct option is required"),
  points: z.number().positive().optional().default(1),
  explanation: z.string().optional(),
});
