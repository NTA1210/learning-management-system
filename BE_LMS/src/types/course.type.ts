import mongoose from "mongoose";

export const enum CourseStatus {
  DRAFT = "draft",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  DELETED = "deleted",
}

export default interface ICourse extends mongoose.Document {
  title: string;
  code?: string;
  logo?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: CourseStatus;
  teacherIds: mongoose.Types.ObjectId[]; // can be multiple teachers
  specialistIds: mongoose.Types.ObjectId[];
  isPublished: boolean;
  capacity?: number;
  meta?: Record<string, any>;
  enrollRequiresApproval?: boolean;
  enrollPasswordHash?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
