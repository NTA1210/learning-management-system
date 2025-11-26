import { NOT_FOUND } from '@/constants/http';
import { ChatRoomModel, MessageModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { GetMessagesInput } from '@/validators/message.schemas';

export const getMessages = async ({ chatRoomId, cursor }: GetMessagesInput) => {
  const chatRoom = await ChatRoomModel.findById(chatRoomId);
  appAssert(chatRoom, NOT_FOUND, 'Chat room not found');

  const query: any = { chatRoomId };
  const limit = 20;

  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  let messages = await MessageModel.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('senderId', 'username avatar_url')
    .lean();

  const nextCursor =
    messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

  messages = messages.reverse();

  return { messages, nextCursor, hasNext: nextCursor !== null && messages.length === limit };
};
