import { IChatRoom, ILastMessage, IParticipant } from '@/types';
import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema<IParticipant>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: { type: String, required: true },
    role: { type: String, required: true },
    avatarUrl: { type: String },
    joinedAt: { type: Date },
  },
  {
    _id: false,
  }
);

const LastMessageSchema = new mongoose.Schema<ILastMessage>(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, trim: true },
    isNotification: { type: Boolean, default: false },
    timestamp: { type: Date, required: true },
  },
  {
    _id: false,
  }
);

const ChatRoomSchema = new mongoose.Schema<IChatRoom>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    name: { type: String, required: true },
    participants: {
      type: [ParticipantSchema],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: LastMessageSchema,
      required: true,
    },
    seenBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

//Indexes
ChatRoomSchema.index({ 'participants.userId': 1, 'lastMessage.timestamp': -1 });
ChatRoomSchema.index({ courseId: 1, createdAt: -1 });
ChatRoomSchema.index({ name: 'text' });
ChatRoomSchema.index({ courseId: 1, 'participants.userId': 1 });
ChatRoomSchema.index({ courseId: 1, name: 1 }, { unique: true });

const ChatRoomModel = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema, 'chatRooms');

export default ChatRoomModel;
