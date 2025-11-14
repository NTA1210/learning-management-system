import mongoose from "mongoose";

export enum SubmissionStatus {
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
  gradeHistory?: {
    grade: number;
    feedback?: string;
    gradedBy: mongoose.Types.ObjectId;
    gradedAt: Date;
  }[]
  isLate?: boolean;
  status: SubmissionStatus;
}

export interface GradeDistribution {
  low: number;
  average: number;
  good: number;
  excellent: number;
}

export interface SubmissionStats {
  totalSubmissions: number;
  submittedOnTime: number;
  submittedLate: number;
  notSubmitted: number;
  averageScore: number | null;
  maxScore: number | null;
  minScore: number | null;
  gradeDistribution: GradeDistribution;
}

export interface SubmissionReportQuery {
  from?: Date;
  to?: Date;
  courseId?: string;
  assignmentId?: string;
  studentId?: string;
}