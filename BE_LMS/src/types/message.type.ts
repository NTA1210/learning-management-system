import mongoose from 'mongoose';
import { Role } from './user.type';

export interface IFile {
  url: string;
  key: string;
  mimeType: string;
  originalName: string;
  size: number;
}

export default interface IMessage extends mongoose.Document<mongoose.Types.ObjectId> {
  chatRoomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: Role;
  content: string;
  file?: IFile;
  createdAt: Date;
  updatedAt: Date;
}
