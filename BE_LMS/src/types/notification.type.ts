import mongoose from "mongoose";

export enum NotificationRecipientType {
  USER = "user",
  SYSTEM = "system"
}

export default interface INotification extends mongoose.Document {
  title: string;
  message: string;
  sender?: mongoose.Types.ObjectId;
  recipientUser?: mongoose.Types.ObjectId; // single user
  recipientCourse?: mongoose.Types.ObjectId; // broadcast to course members
  recipientType?: NotificationRecipientType;
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
  // Soft delete flags
  isDeleted?: boolean;
  deletedAt?: Date;
  markRead(): Promise<INotification>;
}
