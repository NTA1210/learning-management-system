import mongoose from "mongoose";
import IClassSchedule, {ScheduleStatus} from "../types/classSchedule.type";
import {DayOfWeek} from "../types/timeSlot.type";

const ClassScheduleSchema = new mongoose.Schema<IClassSchedule>({
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
            index: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        dayOfWeek: {
            type: String,
            enum: Object.values(DayOfWeek),
            required: true,
        },
        timeSlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TimeSlot",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(ScheduleStatus),
            default: ScheduleStatus.PENDING,
            required: true,
        },
        effectiveFrom: {
            type: Date,
            required: true,
        },
        effectiveTo: {
            type: Date,
        },
        location: {
            type: String,
            trim: true,
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
        requestNote: {
            type: String,
            trim: true,
            maxLength: 500,
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
        recurrencePattern: {
            type: String,
            default: "weekly",
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
// Find schedules for a specific class
ClassScheduleSchema.index({classId: 1, status: 1});

// Find schedules for a specific teacher
ClassScheduleSchema.index({teacherId: 1, status: 1});

// Find schedules by day and time slot
ClassScheduleSchema.index({dayOfWeek: 1, timeSlotId: 1, status: 1});

// Prevent double-booking: One teacher cannot teach 2 classes in the same slot
// This unique index ensures no conflicts
ClassScheduleSchema.index(
    {teacherId: 1, dayOfWeek: 1, timeSlotId: 1, status: 1},
    {
        unique: true,
        partialFilterExpression: {
            status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
        },
    }
);

// Find pending requests for admin approval
ClassScheduleSchema.index({status: 1, requestedAt: -1});

// Validation: Ensure effectiveTo is after effectiveFrom
ClassScheduleSchema.pre("save", function (next) {
    if (this.effectiveTo && this.effectiveTo <= this.effectiveFrom) {
        return next(
            new Error("Effective end date must be after effective start date")
        );
    }
    next();
});

const ClassScheduleModel = mongoose.model<IClassSchedule>(
    "ClassSchedule",
    ClassScheduleSchema,
    "classschedules"
);

export default ClassScheduleModel;

