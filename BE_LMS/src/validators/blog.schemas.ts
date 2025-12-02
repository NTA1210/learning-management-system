import z from 'zod';
import { listParamsSchema } from './helpers/listParams.schema';

export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  thumbnailUrl: z.any().optional(),
  authorName: z.string().min(1, 'Author name is required').max(50, 'Author name is too long'),
  avatar: z.any().optional(),
});

export type CreateBlogParams = z.infer<typeof createBlogSchema>;

export const getBlogsSchema = listParamsSchema;
export type GetBlogsParams = z.infer<typeof getBlogsSchema>;

export const slugSchema = z.string().min(1, 'Slug is required');

export const blogIdSchema = z.string().length(24, 'Invalid blog ID');
