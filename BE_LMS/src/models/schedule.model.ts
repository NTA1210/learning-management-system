import mongoose from "mongoose";
import ISchedule, {ScheduleStatus} from "../types/schedule.type";
import {DayOfWeek} from "../types/timeSlot.type";

const ScheduleSchema = new mongoose.Schema<ISchedule>({
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
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
ScheduleSchema.index({classId: 1, status: 1});

// Find schedules for a specific teacher
ScheduleSchema.index({teacherId: 1, status: 1});

// Find schedules by day and time slot
ScheduleSchema.index({dayOfWeek: 1, timeSlotId: 1, status: 1});

// Lookup index for schedule conflict checks. This must not be unique because
// the same teacher may use the same recurring slot in different semesters.
// Date-range overlap is enforced by schedule.service.ts.
ScheduleSchema.index(
    {teacherId: 1, dayOfWeek: 1, timeSlotId: 1, status: 1, effectiveFrom: 1, effectiveTo: 1},
    {
        name: "teacher_slot_status_effective_range",
    }
);

// Find pending requests for admin approval
ScheduleSchema.index({status: 1, requestedAt: -1});

// Validation: Ensure effectiveTo is after effectiveFrom
ScheduleSchema.pre("save", function (next) {
    if (this.effectiveTo && this.effectiveTo <= this.effectiveFrom) {
        return next(
            new Error("Effective end date must be after effective start date")
        );
    }
    next();
});

const ScheduleModel = mongoose.model<ISchedule>(
    "ClassSchedule",
    ScheduleSchema,
    "classschedules"
);

export default ScheduleModel;
