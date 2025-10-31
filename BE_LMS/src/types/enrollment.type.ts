import mongoose from "mongoose";

export const enum EnrollmentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  DROPPED = "dropped",
  COMPLETED = "completed",
}

export const enum EnrollmentRole {
  STUDENT = "student",
  AUDITOR = "auditor",
}
export const enum EnrollmentMethod {
  SELF = "self",
  INVITED = "invited",
  PASSWORD = "password",
  OTHER = "other",
}

export default interface IEnrollment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  method: EnrollmentMethod;
  role?: EnrollmentRole;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  note?: string;
  progress: {
    totalLessons: number;
    completedLessons: number;
  };
  finalGrade?: number;
  completedAt?: Date;
  droppedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
