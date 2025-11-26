import mongoose from 'mongoose';

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  username: string;
  role: string;
  avatarUrl: string;
  joinedAt: Date;
}

export interface ILastMessage {
  id: mongoose.Types.ObjectId;
  content?: string | null;
  senderId: mongoose.Types.ObjectId;
  timestamp: Date;
}

export default interface IChatRoom extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  name: string;
  participants: IParticipant[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage: ILastMessage;
  seenBy: mongoose.Types.ObjectId[];
  unreadCounts: Map<mongoose.Types.ObjectId, number>;
  createdAt: Date;
  updatedAt: Date;
}
