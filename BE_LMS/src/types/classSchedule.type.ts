import mongoose from "mongoose";
import { DayOfWeek } from "./timeSlot.type";

export enum ScheduleStatus {
  PENDING = "pending", // Awaiting admin approval
  APPROVED = "approved", // Approved by admin
  REJECTED = "rejected", // Rejected by admin
  ACTIVE = "active", // Currently in use
  INACTIVE = "inactive", // Temporarily disabled
}

export default interface IClassSchedule extends mongoose.Document {
  /**
   * Reference to the class
   */
  classId: mongoose.Types.ObjectId;

  /**
   * Reference to the teacher who owns this class
   */
  teacherId: mongoose.Types.ObjectId;

  /**
   * Day of the week
   */
  dayOfWeek: DayOfWeek;

  /**
   * Reference to the time slot
   */
  timeSlotId: mongoose.Types.ObjectId;

  /**
   * Schedule status
   */
  status: ScheduleStatus;

  /**
   * Effective date range for this schedule
   * Allows for semester-based scheduling
   */
  effectiveFrom: Date;
  effectiveTo?: Date;

  /**
   * Classroom/location for this schedule
   */
  location?: string;

  /**
   * Request information
   */
  requestedBy: mongoose.Types.ObjectId; // Teacher who requested
  requestedAt: Date;
  requestNote?: string;

  /**
   * Approval information
   */
  approvedBy?: mongoose.Types.ObjectId; // Admin who approved/rejected
  approvedAt?: Date;
  approvalNote?: string;

  /**
   * Recurring pattern (default is weekly)
   * For future expansion: could support bi-weekly, monthly, etc.
   */
  recurrencePattern?: string;

  /**
   * Audit fields
   */
  createdAt?: Date;
  updatedAt?: Date;
}

