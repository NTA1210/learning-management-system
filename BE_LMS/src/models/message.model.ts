import { Role } from '@/types';
import IMessage, { IFile } from '@/types/message.type';
import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema<IFile>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    mimeType: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
  },
  {
    _id: false,
  }
);

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: { type: String, enum: Role, required: true },
    content: { type: String, trim: true },
    file: { type: [FileSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

//Indexes
MessageSchema.index({ chatRoomId: 1, createdAt: -1 });
MessageSchema.index({ chatRoomId: 1, senderId: 1 });

const MessageModel = mongoose.model<IMessage>('Message', MessageSchema, 'messages');

export default MessageModel;
