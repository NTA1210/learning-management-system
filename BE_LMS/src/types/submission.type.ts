import mongoose from "mongoose";

export const enum SubmissionStatus {
  NOT_SUBMITTED = "not_submitted",
  SUBMITTED = "submitted",
  RESUBMITTED = "re_submitted",
  GRADED = "graded",
  OVERDUE = "overdue",
}

export default interface ISubmission extends mongoose.Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  originalName: string;
  key: string;
  mimeType?: string;
  size: number;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  isLate?: boolean;
  status: SubmissionStatus;
}
