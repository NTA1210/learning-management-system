import mongoose from "mongoose";

export default interface IForum extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  isActive?: boolean;
  isArchived?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
