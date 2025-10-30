import mongoose from "mongoose";

export default interface IAssignment extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  maxScore?: number;
  dueDate?: Date;
  allowLate?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
