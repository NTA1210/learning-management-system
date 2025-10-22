import mongoose from "mongoose";

export default interface IAssignment extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  maxScore?: number;
  dueDate?: Date;
  allowLate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
