import { ListParams } from '@/types/dto';
import z from 'zod';
import { datePreprocess } from './date.schema';

export const listParamsSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      const num = Number(val);
      return Number.isFinite(num) && num > 0 ? num : 1;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number(val);
      return Number.isFinite(num) && num > 0 && num <= 100 ? num : 10;
    }),

  search: z.string().optional(),

  createdAt: datePreprocess.optional(),
  updatedAt: datePreprocess.optional(),

  sortBy: z.enum(['createdAt', 'title', 'name' , 'updatedAt']).optional(),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}) satisfies z.ZodType<ListParams>;
