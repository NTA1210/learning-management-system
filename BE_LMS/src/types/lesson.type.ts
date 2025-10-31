import mongoose from "mongoose";

export default interface ILesson extends mongoose.Document {
  title: string;
  courseId: mongoose.Types.ObjectId;
  content?: string;
  order?: number;
  durationSeconds?: number;
  isPublished?: boolean;
  publishedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
