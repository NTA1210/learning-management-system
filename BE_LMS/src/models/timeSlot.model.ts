import mongoose from 'mongoose';
import ITimeSlot, { DayOfWeek } from '../types/timeSlot.type';

const TimeSlotSchema = new mongoose.Schema<ITimeSlot>(
  {
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    slotName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    duration: {
      type: Number,
      required: true,
      min: 30, // Minimum 30 minutes
      max: 300, // Maximum 5 hours
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    applicableDays: [
      {
        type: String,
        enum: Object.values(DayOfWeek),
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TimeSlotSchema.index({ slotNumber: 1 }, { unique: true });
TimeSlotSchema.index({ isActive: 1, order: 1 });

// Validation: Ensure endTime is after startTime
TimeSlotSchema.pre('save', function (next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);

  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }

  // Verify duration matches the time difference
  const calculatedDuration = endMinutes - startMinutes;
  if (this.duration !== calculatedDuration) {
    this.duration = calculatedDuration; // Auto-correct duration
  }

  next();
});

const TimeSlotModel = mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema, 'timeslots');

export default TimeSlotModel;
