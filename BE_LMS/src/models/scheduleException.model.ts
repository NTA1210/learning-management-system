import mongoose from "mongoose";
import IScheduleException, {
  ExceptionType,
  ExceptionStatus,
} from "../types/scheduleException.type";

const ScheduleExceptionSchema = new mongoose.Schema<IScheduleException>(
  {
    classScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSchedule",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    exceptionDate: {
      type: Date,
      required: true,
    },
    exceptionType: {
      type: String,
      enum: Object.values(ExceptionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ExceptionStatus),
      default: ExceptionStatus.PENDING,
      required: true,
    },
    newTimeSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimeSlot",
    },
    newLocation: {
      type: String,
      trim: true,
    },
    replacementTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    approvalNote: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    studentsNotified: {
      type: Boolean,
      default: false,
      required: true,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Find exceptions for a specific schedule
ScheduleExceptionSchema.index({ classScheduleId: 1, exceptionDate: 1 });

// Find exceptions for a specific class
ScheduleExceptionSchema.index({ classId: 1, exceptionDate: 1 });

// Find pending exception requests
ScheduleExceptionSchema.index({ status: 1, requestedAt: -1 });

// Prevent duplicate exceptions for the same schedule on the same date
ScheduleExceptionSchema.index(
  { classScheduleId: 1, exceptionDate: 1 },
  { unique: true }
);

// Find exceptions by date range
ScheduleExceptionSchema.index({ exceptionDate: 1, status: 1 });

// Validation: Ensure exception date is not in the past
ScheduleExceptionSchema.pre("save", function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.isNew && this.exceptionDate < today) {
    return next(
      new Error("Exception date cannot be in the past")
    );
  }

  // If rescheduled, must have a new time slot
  if (this.exceptionType === ExceptionType.RESCHEDULE && !this.newTimeSlotId) {
    return next(
      new Error("Rescheduled exception must have a new time slot")
    );
  }

  // If replacement, must have a replacement teacher
  if (this.exceptionType === ExceptionType.REPLACEMENT && !this.replacementTeacherId) {
    return next(
      new Error("Replacement exception must have a replacement teacher")
    );
  }

  next();
});

const ScheduleExceptionModel = mongoose.model<IScheduleException>(
  "ScheduleException",
  ScheduleExceptionSchema,
  "scheduleexceptions"
);

export default ScheduleExceptionModel;

