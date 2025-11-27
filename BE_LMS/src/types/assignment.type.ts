import mongoose from "mongoose";

export default interface IAssignment extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  maxScore?: number;
  dueDate?: Date;
  allowLate?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  // Optional attached file metadata for the assignment (uploaded by teacher)
  fileOriginalName?: string;
  fileMimeType?: string;
  fileKey?: string;
  fileSize?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
