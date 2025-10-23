import mongoose from "mongoose";

export default interface ICourse extends mongoose.Document {
  title: string;
  code?: string;
  description?: string;
  category?: mongoose.Types.ObjectId;
  teachers: mongoose.Types.ObjectId[]; // can be multiple teachers
  isPublished: boolean;
  capacity?: number;
  createdAt?: Date;
  updatedAt?: Date;
  meta?: Record<string, any>;
}
