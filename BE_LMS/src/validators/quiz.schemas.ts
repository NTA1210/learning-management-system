import { QuizQuestionType } from "@/types/quizQuestion.type";
import mongoose from "mongoose";
import { text } from "stream/consumers";
import z from "zod";

export const courseIdSchema = z.string().length(24, "Invalid course ID");

export const createQuizSchema = z
  .object({
    title: z.string().min(1).max(255),
    courseId: courseIdSchema,
    description: z.string().optional(),
    startTime: z.date(),
    endTime: z.date(),
    shuffleQuestions: z.boolean().default(false),
    questionIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      const { startTime, endTime } = data;
      return startTime < endTime;
    },
    {
      message: "Start time must be before end time",
      path: ["endTime"],
    }
  );

export type CreateQuiz = z.infer<typeof createQuizSchema>;

export const addSnapshotQuestionsSchema = z.object({
  quizId: z.string().length(24, "Invalid quiz ID"),
  questions: z
    .array(
      z.object({
        id: z.string().default(() => new mongoose.Types.ObjectId().toString()),
        text: z.string(),
        type: z.enum(QuizQuestionType),
        options: z
          .array(z.string())
          .min(2, "At least two options are required"),
        correctOptions: z
          .array(
            z.number().refine((v) => v === 0 || v === 1, {
              message: "Correct option must be 0 or 1",
              path: ["correctOptions"],
            })
          )
          .min(1, "At least one correct option is required")
          .refine((v) => v.includes(1), {
            message: "At least one correct option is required",
            path: ["correctOptions"],
          }),

        points: z.number().positive().optional().default(1),
        explanation: z.string().optional(),
        isExternal: z.boolean().default(true),
      })
    )
    .min(1, "At least one question is required"),
});

export type AddSnapshotQuestions = z.infer<typeof addSnapshotQuestionsSchema>;
