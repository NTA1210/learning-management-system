import { SemesterType } from '@/types/semester.type';
import z from 'zod';
import { datePreprocess } from './helpers/date.schema';

export const semesterIdSchema = z.string().length(24, 'Invalid semester ID');
export const createSemesterSchema = z.object({
  year: z.number(),
  type: z.enum(SemesterType),
  startDate: datePreprocess.default(() => new Date()),
  endDate: datePreprocess,
});

export type ICreateSemesterParams = z.infer<typeof createSemesterSchema>;

export const updateSemesterSchema = createSemesterSchema.partial().safeExtend({
  semesterId: semesterIdSchema,
});

export type IUpdateSemesterParams = z.infer<typeof updateSemesterSchema>;
