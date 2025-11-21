import z from 'zod';
import { listParamsSchema } from './helpers/listParams.schema';
import { ListParams } from '@/types/dto';
import { QuizQuestionType } from '@/types/quizQuestion.type';
import { datePreprocess } from './helpers/date.schema';

export const subjectIdSchema = z.string().length(24, 'Invalid subject ID');
export const importQuizQuestionParamsSchema = z.object({
  xmlFile: z.any(),
  subjectId: subjectIdSchema,
});

interface IListQuizQuestionParams extends ListParams {
  subjectId?: string;
  type?: QuizQuestionType;
  from?: Date;
  to?: Date;
}

export const listQuizQuestionSchema = listParamsSchema
  .extend({
    subjectId: subjectIdSchema.optional(),
    type: z.enum(QuizQuestionType).optional(),
    from: datePreprocess.optional(),
    to: datePreprocess.optional(),
  })
  .refine(
    (val) => {
      if (val.from && val.to) {
        return val.from.getTime() <= val.to.getTime();
      }
      return true;
    },
    {
      message: 'From date must be less than or equal to To date',
      path: ['to'],
    }
  ) satisfies z.ZodType<IListQuizQuestionParams>;

export interface ICreateQuizQuestionParams {
  subjectId: string;
  text: string;
  images?: Express.Multer.File[];
  type?: QuizQuestionType;
  options: string[];
  correctOptions: number[];
  points?: number;
  explanation?: string;
}

export const createQuizQuestionSchema = z
  .object({
    subjectId: subjectIdSchema,
    text: z.string().min(1, 'Text is required'),
    images: z.array(z.any()).optional(),
    type: z.enum(QuizQuestionType).default(QuizQuestionType.MCQ),
    options: z.array(z.string()).min(2, 'At least two options are required'),
    correctOptions: z
      .array(
        z.number().refine((v) => v === 0 || v === 1, {
          message: 'Correct option must be 0 or 1',
        })
      )
      .min(1, 'At least one correct option is required')
      .refine((arr) => arr.includes(1), {
        message: 'At least one correct option is required',
      }),
    points: z.number().positive().optional().default(1),
    explanation: z.string().optional(),
  })
  .refine((val) => val.options.length === val.correctOptions.length, {
    message: 'Number of options and correct options must be equal',
    path: ['correctOptions'],
  });

export interface IUpdateQuizQuestionParams extends Partial<ICreateQuizQuestionParams> {
  quizQuestionId: string;
  deletedKeys?: string[];
}
export const quizQuestionIdSchema = z.string().length(24, 'Invalid question ID');

export const updateQuizQuestionSchema = createQuizQuestionSchema.partial().safeExtend({
  quizQuestionId: quizQuestionIdSchema,
  deletedKeys: z.array(z.string()).optional(),
});

export const multiQuizQuestionIdSchema = z.array(quizQuestionIdSchema);

export interface IGetRandomQuestionsParams {
  count?: number;
  subjectId: string;
}
export const randomQuizQuestionSchema = z.object({
  subjectId: subjectIdSchema,
  count: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') {
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }
    return val;
  }, z.number().min(1, 'Count must be at least 1').max(100, 'Count must be at most 100').default(10).optional()),
});

export const uploadImagesSchema = z.object({
  quizId: subjectIdSchema,
  images: z.array(z.any()).min(1, 'At least one image is required'),
});

export type TUploadImagesParams = z.infer<typeof uploadImagesSchema>;

export const deleteImagesSchema = z.string().min(1, 'Image URL is required');
