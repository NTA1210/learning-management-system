import z from 'zod';

export const createChatroomSchema = z.object({
  courseId: z.string().length(24, 'Course ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export type CreateChatroomParams = z.infer<typeof createChatroomSchema>;
