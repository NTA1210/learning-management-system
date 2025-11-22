import { SemesterType } from '@/types/semester.type';
import z from 'zod';
import { datePreprocess, nonFutureDateSchema, nonPastDateSchema } from './helpers/date.schema';

export const semesterIdSchema = z.string().length(24, 'Invalid semester ID');
export const createSemesterSchema = z
  .object({
    year: z
      .union([z.string(), z.number()])
      .transform((val) => {
        const year = Number(val);
        if (Number.isFinite(year)) return year;
        return undefined;
      })
      .pipe(
        z
          .number()
          .int()
          .min(1900, 'Year must be greater than 1900')
          .max(2100, 'Year must be less than 2100')
      ),
    type: z.enum(SemesterType),
    startDate: datePreprocess.default(() => new Date()),
    endDate: nonPastDateSchema,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type ICreateSemesterParams = z.infer<typeof createSemesterSchema>;

export const updateSemesterSchema = createSemesterSchema.partial().safeExtend({
  semesterId: semesterIdSchema,
});

export type IUpdateSemesterParams = z.infer<typeof updateSemesterSchema>;
