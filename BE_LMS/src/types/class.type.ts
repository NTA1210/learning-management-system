import mongoose from "mongoose";

export enum ClassStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export default interface IClass extends mongoose.Document {
  /**
   * Reference to the parent course
   * Multiple classes can be created from the same course
   */
  courseId: mongoose.Types.ObjectId;

  /**
   * Class identifier (e.g., "SE18D09")
   */
  className: string;

  /**
   * Teacher(s) assigned to this specific class.
   * Usually 1-2 teachers per class
   */
  teacherIds: mongoose.Types.ObjectId[];

  /**
   * Maximum number of students allowed in this class
   */
  capacity: number;

  /**
   * Current enrollment count (denormalized for performance)
   */
  currentEnrollment: number;

  /**
   * Class status
   */
  status: ClassStatus;

  /**
   * Academic period information
   */
  semester?: string; // e.g., "Fall 2024", "Spring 2025"
  academicYear?: string; // e.g., "2024-2025"

  /**
   * Physical/virtual classroom information
   */
  classroom?: string; // e.g., "Gamma 301", "Online - Zoom"

  /**
   * Additional metadata
   */
  meta?: Record<string, any>;

  /**
   * Audit fields
   */
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

