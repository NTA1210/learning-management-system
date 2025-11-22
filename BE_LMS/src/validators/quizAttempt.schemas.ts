import mongoose from "mongoose";
import z from "zod";

const quizIdSchema = z.string().length(24, "Invalid quiz ID");
export const quizAttemptIdSchema = z
  .string()
  .length(24, "Invalid quiz attempt ID");

export const enrollQuizSchema = z.object({
  quizId: quizIdSchema,
  hashPassword: z.string(),
});

export type EnrollUserInfo = {
  userId: mongoose.Types.ObjectId;
  role: string;
  userAgent?: string | string[];
  ip?: string | null;
};

export type EnrollQuizInput = z.infer<typeof enrollQuizSchema> & {
  user: EnrollUserInfo;
};

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.array(
    z.number().refine((v) => v === 0 || v === 1, {
      message: "Answer must be 0 or 1",
    })
  ),
  correct: z.boolean().optional(),
  pointsEarned: z.number().optional(),
});

export type Answer = z.infer<typeof answerSchema>;

export const submitQuizSchema = z.object({
  quizAttemptId: quizAttemptIdSchema,
  answers: z.array(answerSchema),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
