import z from 'zod';

export const chatRoomIdSchema = z.string().length(24, 'Invalid chat room ID');
export const getMessagesSchema = z.object({
  chatRoomId: chatRoomIdSchema,
  cursor: z.preprocess((val) => {
    if (typeof val === 'string' && val.length > 0) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }, z.instanceof(Date).optional()),
});

export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
