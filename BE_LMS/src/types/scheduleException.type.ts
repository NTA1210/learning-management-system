import mongoose from "mongoose";

export enum ExceptionType {
  CANCELLATION = "cancellation", // Class cancelled for this date
  RESCHEDULE = "reschedule", // Moved to different time/location
  REPLACEMENT = "replacement", // Different teacher
  ROOM_CHANGE = "room_change", // Only location changed
}

export enum ExceptionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ACTIVE = "active",
}

export default interface IScheduleException extends mongoose.Document {
  /**
   * Reference to the original class schedule
   */
  classScheduleId: mongoose.Types.ObjectId;

  /**
   * Reference to the class
   */
  classId: mongoose.Types.ObjectId;

  /**
   * Specific date for this exception (overrides the recurring schedule)
   */
  exceptionDate: Date;

  /**
   * Type of exception
   */
  exceptionType: ExceptionType;

  /**
   * Status of this exception request
   */
  status: ExceptionStatus;

  /**
   * New time slot (if rescheduled)
   */
  newTimeSlotId?: mongoose.Types.ObjectId;

  /**
   * New location (if changed)
   */
  newLocation?: string;

  /**
   * Replacement teacher (if applicable)
   */
  replacementTeacherId?: mongoose.Types.ObjectId;

  /**
   * Reason for the exception
   */
  reason: string;

  /**
   * Request information
   */
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;

  /**
   * Approval information
   */
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalNote?: string;

  /**
   * Whether students have been notified
   */
  studentsNotified: boolean;
  notifiedAt?: Date;

  /**
   * Audit fields
   */
  createdAt?: Date;
  updatedAt?: Date;
}