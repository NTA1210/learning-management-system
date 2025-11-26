import { ChatRoomModel, UserModel } from '@/models';
import mongoose from 'mongoose';

export const getChatRooms = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId);

  const chatRooms = await ChatRoomModel.find({
    'participants.userId': userId,
  }).populate([
    {
      path: 'courseId',
      select: 'title subjectId startDate endDate logo semesterId',
    },
    {
      path: 'lastMessage.senderId',
      select: 'fullname email avatar_url',
    },
  ]);

  return [
    ...chatRooms.map((chatRoom) => {
      const { _id, courseId, name, participants, lastMessage, unreadCounts } = chatRoom;
      return {
        chatRoomId: _id,
        name,
        course: courseId,
        participants,
        lastMessage,
        unreadCounts: unreadCounts.get(userId) || 0,
      };
    }),
  ];
};
