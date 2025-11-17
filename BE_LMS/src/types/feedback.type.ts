import mongoose from "mongoose";

export enum FeedbackType {
  SYSTEM = "system",
  TEACHER = "teacher",
  OTHER = "other",
}

export default interface IFeedback extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  type: FeedbackType;
  title: string;
  description: string;
  rating: number;
  userId: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId; // ví dụ teacherId hoặc courseId
  originalName?: string;
  mimeType?: string;
  key?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
