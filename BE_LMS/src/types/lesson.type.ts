import mongoose from "mongoose";

export default interface ILesson extends mongoose.Document {
  title: string;
  courseId: mongoose.Types.ObjectId;
  content?: string;
  order?: number;
  durationMinutes?: number;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
