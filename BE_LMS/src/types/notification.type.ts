import mongoose from "mongoose";

export const enum NotificationType {
  USER = "user",
  COURSE = "course",
  SYSTEM = "system",
}

export default interface INotification extends mongoose.Document {
  title: string;
  message: string;
  sender?: mongoose.Types.ObjectId;
  recipientUser?: mongoose.Types.ObjectId; // single user
  recipientCourse?: mongoose.Types.ObjectId; // broadcast to course members
  recipientType?: NotificationType;
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
}
