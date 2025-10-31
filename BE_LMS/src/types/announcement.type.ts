import mongoose from "mongoose";

export default interface IAnnouncement extends mongoose.Document {
  title: string;
  content: string;
  courseId?: mongoose.Types.ObjectId; // if null, system-wide
  authorId?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
