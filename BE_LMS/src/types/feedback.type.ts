import mongoose from "mongoose";

export enum FeedbackType {
  SYSTEM = "system",
  TEACHER = "teacher",
  COURSE = "course",
  OTHER = "other",
}

export default interface IFeedback extends mongoose.Document {
  type: FeedbackType;
  content: string;
  userId: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId; // ví dụ teacherId hoặc courseId
  createdAt?: Date;
  updatedAt?: Date;
}
