import z from "zod";
import {DayOfWeek} from "@/types/timeSlot.type";
import {ExceptionType} from "@/types/scheduleException.type";
import mongoose from "mongoose";
import {ScheduleStatus} from "@/types";

// Schema for a single schedule slot (day + time combination)
export const scheduleSlotSchema = z.object({
    dayOfWeek: z.enum(DayOfWeek, {
        message: "Invalid day of week",
    }),
    timeSlotId: z.string().min(1, "Time slot ID is required"),
});

// Schema for creating a schedule request (now supports multiple slots)
export const createScheduleSchema = z.object({
    courseId: z.string().min(1, "Course ID is required"),
    slots: z.array(scheduleSlotSchema)
        .min(1, "At least one schedule slot is required")
        .refine(
            (slots) => {
                // Check for duplicate day-timeslot combinations
                const uniqueSlots = new Set(
                    slots.map(s => `${s.dayOfWeek}-${s.timeSlotId}`)
                );
                return uniqueSlots.size === slots.length;
            },
            {
                message: "Duplicate day and time slot combinations are not allowed",
            }
        ),
    effectiveFrom: z.string().transform((val) => new Date(val)),
    effectiveTo: z.string().transform((val) => new Date(val)).optional(),
    location: z.string().optional(),
    requestNote: z.string().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

// Schema for approving/rejecting schedule request
export const approveScheduleSchema = z.object({
    approved: z.boolean(),
    approvalNote: z.string().optional(),
});

export type ApproveScheduleInput = z.infer<typeof approveScheduleSchema>;

// Schema for creating schedule exception
export const createScheduleExceptionSchema = z.object({
    exceptionDate: z.string().transform((val) => new Date(val)),
    exceptionType: z.enum(ExceptionType, {
        message: "Invalid exception type",
    }),
    newTimeSlotId: z.string().optional(),
    newLocation: z.string().optional(),
    replacementTeacherId: z.string().optional().transform((val) => val ? new mongoose.Types.ObjectId(val) : undefined),
    reason: z.string().min(1, "Reason is required"),
});

export type CreateScheduleExceptionInput = z.infer<typeof createScheduleExceptionSchema>;

// Schema for approving/rejecting exception
export const approveExceptionSchema = z.object({
    approved: z.boolean(),
    approvalNote: z.string().optional(),
});

export type ApproveExceptionInput = z.infer<typeof approveExceptionSchema>;

// Schema for checking slot availability
export const checkSlotAvailabilitySchema = z.object({
    teacherId: z.string().min(1, "Teacher ID is required"),
    dayOfWeek: z.enum(DayOfWeek, {
        message: "Invalid day of week",
    }),
    timeSlotId: z.string().min(1, "Time slot ID is required"),
});

export type CheckSlotAvailabilityQuery = z.infer<typeof checkSlotAvailabilitySchema>;

// Schema for getting schedule with exceptions
export const getScheduleRangeSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
});

export type GetScheduleRangeQuery = z.infer<typeof getScheduleRangeSchema>;

// Schema for path params
export const scheduleIdSchema = z.string().min(1, "Schedule ID is required");
export const exceptionIdSchema = z.string().min(1, "Exception ID is required");
export const courseIdSchema = z.string().min(1, "Course ID is required");
export const teacherIdSchema = z.string().min(1, "Teacher ID is required");

// Schema for query filters
export const timeSlotFilterSchema = z.object({
    isActive: z.string().optional(),
});

export type TimeSlotFilterQuery = z.infer<typeof timeSlotFilterSchema>;

export const teacherScheduleQuerySchema = z.object({
    date: z.string().optional(),
    status: z.union([
        z.enum(ScheduleStatus),
        z.array(z.enum(ScheduleStatus))
    ])
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        }),
});

export const courseScheduleQuerySchema = z.object({
    status: z.union([
        z.enum(ScheduleStatus),
        z.array(z.enum(ScheduleStatus))
    ])
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            return Array.isArray(val) ? val : [val];
        }),
});

export type TeacherScheduleQuery = z.infer<typeof teacherScheduleQuerySchema>;