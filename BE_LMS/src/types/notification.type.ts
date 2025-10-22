import mongoose from "mongoose";

export default interface INotification extends mongoose.Document {
  title: string;
  message: string;
  sender?: mongoose.Types.ObjectId;
  recipientUser?: mongoose.Types.ObjectId; // single user
  recipientCourse?: mongoose.Types.ObjectId; // broadcast to course members
  recipientType?: "user" | "course" | "all";
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
}
