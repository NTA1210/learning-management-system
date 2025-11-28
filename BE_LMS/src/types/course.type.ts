import mongoose from 'mongoose';

export enum CourseStatus {
  DRAFT = 'draft',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  // ✅ FIX: Removed DELETED status - we use isDeleted field for soft delete instead
}

export default interface ICourse extends mongoose.Document {
  semesterId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  subjectId?: mongoose.Types.ObjectId;
  logo?: string;
  key?: string; // MinIO key for logo file
  description?: string;
  startDate: Date;
  endDate: Date;
  status: CourseStatus;
  /** Can be multiple teachers. */
  teacherIds: mongoose.Types.ObjectId[];
  isPublished: boolean;
  capacity?: number;
  meta?: Record<string, any>;
  enrollRequiresApproval?: boolean;
  enrollPasswordHash?: string;
  createdBy?: mongoose.Types.ObjectId;
  /**
   * Soft delete fields
   * */
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
