import z from 'zod';
import mongoose from 'mongoose';
import { listParamsSchema } from '@/validators/helpers/listParams.schema';
import { ListParams } from '@/types/dto';
import { ISpecialist } from '@/types';

// Schema for listing specialists with pagination and filters
export const listSpecialistsSchema = listParamsSchema.extend({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  majorId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type ListSpecialistsQuery = z.infer<typeof listSpecialistsSchema>;

// Schema for creating a specialist
export const createSpecialistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255).optional(),
  description: z.string().optional(),
  majorId: z
    .string()
    .min(1, 'majorId is required')
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Valid majorId is required',
    }),
});

export type CreateSpecialistInput = z.infer<typeof createSpecialistSchema>;

// Schema for updating a specialist
export const updateSpecialistSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  majorId: z
    .string()
    .min(1, 'majorId is required')
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Valid majorId is required',
    })
    .optional(),
});

export type UpdateSpecialistInput = z.infer<typeof updateSpecialistSchema>;

// Schema for specialist ID param
export const specialistIdSchema = z.string().min(1, 'Specialist ID is required');

export const specialistSlugSchema = z.string().min(1, 'Specialist slug is required');
