import { OK } from '@/constants/http';
import { getMessages } from '@/services/message.service';
import { catchErrors } from '@/utils/asyncHandler';
import { getMessagesSchema } from '@/validators/message.schemas';

export const getMessagesHandler = catchErrors(async (req, res) => {
  const input = getMessagesSchema.parse({
    chatRoomId: req.params.chatRoomId,
    cursor: req.query.cursor,
  });

  const { messages, nextCursor, hasNext } = await getMessages(input);

  return res.success(OK, {
    data: {
      messages,
      nextCursor,
      hasNext,
    },
    message: 'Messages retrieved successfully',
  });
});
