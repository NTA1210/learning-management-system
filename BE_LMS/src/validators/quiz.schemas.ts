import { QuizQuestionType } from '@/types/quizQuestion.type';
import mongoose from 'mongoose';
import z from 'zod';
import { datePreprocess } from './helpers/date.schema';

export const courseIdSchema = z.string().length(24, 'Invalid course ID');

export const snapShotQuestion = z
  .object({
    id: z
      .string()
      .optional()
      .default(() => new mongoose.Types.ObjectId().toString()),
    text: z.string(),
    type: z.enum(QuizQuestionType),
    options: z.array(z.string()).min(2, 'At least two options are required'),
    correctOptions: z
      .array(
        z.number().refine((v) => v === 0 || v === 1, {
          message: 'Correct option must be 0 or 1',
          path: ['correctOptions'],
        })
      )
      .min(1, 'At least one correct option is required')
      .refine((v) => v.includes(1), {
        message: 'At least one correct option is required',
        path: ['correctOptions'],
      }),
    images: z
      .array(
        z.object({
          url: z.string(),
          fromDB: z.boolean().default(false),
        })
      )
      .optional(),
    points: z.number().positive().optional().default(1),
    explanation: z.string().optional(),
    isExternal: z.boolean().default(true),
    isNewQuestion: z.boolean().default(true),
    isDeleted: z.boolean().default(false),
    isDirty: z.boolean().default(false),
  })
  .refine((val) => val.options.length === val.correctOptions.length, {
    message: 'Number of options and correct options must be equal',
    path: ['correctOptions'],
  });

export type SnapshotQuestion = z.infer<typeof snapShotQuestion>;

export const createQuizSchema = z
  .object({
    title: z.string().min(1).max(255),
    courseId: courseIdSchema,
    description: z.string().optional(),
    startTime: datePreprocess.default(() => new Date()),
    endTime: datePreprocess,
    shuffleQuestions: z.boolean().default(false),
    // questionIds: z.array(z.string()).optional(),
    snapshotQuestions: z.array(snapShotQuestion).optional().default([]),
  })
  .refine(
    (data) => {
      const { startTime, endTime } = data;
      return startTime < endTime;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  );

export type CreateQuiz = z.infer<typeof createQuizSchema>;

export const updateQuizSchema = z
  .object({
    quizId: z.string().length(24, 'Invalid quiz ID'),
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    startTime: datePreprocess.optional(),
    endTime: datePreprocess.optional(),
    shuffleQuestions: z.boolean().optional(),
    snapshotQuestions: z
      .array(snapShotQuestion)
      .min(1, 'At least one question is required')
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      const { startTime, endTime } = data;
      if (startTime && endTime) return startTime < endTime;

      return true;
    },
    {
      message: 'Start time must be before end time',
      path: ['endTime'],
    }
  );

export type UpdateQuiz = z.infer<typeof updateQuizSchema>;

export const quizIdSchema = z.string().length(24, 'Invalid quiz ID');
