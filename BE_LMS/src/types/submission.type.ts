import mongoose from "mongoose";

export default interface ISubmission extends mongoose.Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  isLate?: boolean;
  status: "not_submitted" | "submitted" | "graded" | "overdue";
}
