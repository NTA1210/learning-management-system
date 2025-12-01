import { ChatRoomModel } from '@/models';
import mongoose from 'mongoose';

export const getChatRoom = async (userId: mongoose.Types.ObjectId) => {
  const chatRooms = await ChatRoomModel.find({
    'participants.userId': userId,
  });

  return chatRooms;
};
