import TimeSlotModel from "../models/timeSlot.model";
import ScheduleModel from "../models/schedule.model";
import ScheduleExceptionModel from "../models/scheduleException.model";
import ISchedule, {ScheduleStatus} from "../types/schedule.type";
import {ExceptionStatus, ExceptionType} from "../types/scheduleException.type";
import {DayOfWeek} from "../types/timeSlot.type";
import appAssert from "../utils/appAssert";
import {BAD_REQUEST, CONFLICT, NOT_FOUND} from "../constants/http";
import {CourseModel, UserModel} from "@/models";
import {Role} from "@/types";
import mongoose from "mongoose";

export interface ScheduleSlot {
    dayOfWeek: DayOfWeek;
    timeSlotId: string;
}

export interface CreateScheduleInput {
    courseId: string;
    teacherId: mongoose.Types.ObjectId;
    slots: ScheduleSlot[];
    effectiveFrom: Date;
    effectiveTo?: Date;
    location?: string;
    requestNote?: string;
}

export interface CreateExceptionInput {
    scheduleId: string;
    exceptionDate: Date;
    exceptionType: ExceptionType;
    newTimeSlotId?: string;
    newLocation?: string;
    replacementTeacherId?: mongoose.Types.ObjectId;
    reason: string;
    requestedBy: mongoose.Types.ObjectId;
}

export const getAllTimeSlots = async (filter: any = {}) => {
    return await TimeSlotModel.find(filter).sort({order: 1}).lean();
};

export const createScheduleRequest = async (input: CreateScheduleInput) => {
    // Verify course exists
    const courseData = await CourseModel.findById(input.courseId);
    appAssert(courseData, NOT_FOUND, "Course not found");

    // Verify teacher is assigned to this course
    const isAssigned = courseData.teacherIds.some(
        (id: mongoose.Types.ObjectId) => id.toString() === input.teacherId.toString()
    );
    appAssert(isAssigned, BAD_REQUEST, "Teacher is not assigned to this course");

    // Check for conflicts for all requested slots
    // Include PENDING to prevent duplicate requests, and APPROVED/ACTIVE for actual conflicts
    const conflictChecks = input.slots.map(async (slot) => {
        const conflict = await ScheduleModel.findOne({
            teacherId: input.teacherId,
            dayOfWeek: slot.dayOfWeek,
            timeSlotId: slot.timeSlotId,
            status: {$in: [ScheduleStatus.PENDING, ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
        });

        if (conflict) {
            // Get day and timeslot details for better error message
            const timeSlot = await TimeSlotModel.findById(slot.timeSlotId);
            return {
                hasConflict: true,
                dayOfWeek: slot.dayOfWeek,
                timeSlot: timeSlot?.slotName || slot.timeSlotId,
                status: conflict.status,
            };
        }

        return {hasConflict: false};
    });

    const conflictResults = await Promise.all(conflictChecks);
    const conflicts = conflictResults.filter(r => r.hasConflict);

    appAssert(
        conflicts.length === 0,
        CONFLICT,
        conflicts.length === 1
            ? `Teacher already has a ${conflicts[0].status === ScheduleStatus.PENDING ? 'pending request' : 'course scheduled'} on ${conflicts[0].dayOfWeek} at ${conflicts[0].timeSlot}`
            : `Teacher already has ${conflicts.some(c => c.status === ScheduleStatus.PENDING) ? 'pending requests or courses' : 'courses'} scheduled on: ${conflicts.map(c => `${c.dayOfWeek} at ${c.timeSlot}`).join(", ")}`
    );

    // Create schedule records for each slot in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Create all schedule documents in the session
        const scheduleDocs = input.slots.map((slot) => ({
            courseId: input.courseId,
            teacherId: input.teacherId,
            dayOfWeek: slot.dayOfWeek,
            timeSlotId: slot.timeSlotId,
            effectiveFrom: input.effectiveFrom,
            effectiveTo: input.effectiveTo,
            location: input.location,
            requestNote: input.requestNote,
            status: ScheduleStatus.PENDING,
            requestedBy: input.teacherId,
            requestedAt: new Date(),
        }));

        // Use insertMany instead of multiple create calls to avoid transaction number mismatch
        const createdSchedules = await ScheduleModel.insertMany(scheduleDocs, {session});

        await session.commitTransaction();

        // Populate the created schedules
        return await ScheduleModel.find({
            _id: {$in: createdSchedules.map(s => s._id)}
        }).populate([
            {path: "courseId", select: "title subjectId startDate endDate"},
            {path: "teacherId", select: "fullname email"},
            {path: "timeSlotId"},
        ]);
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getTeacherWeeklySchedule = async (
    teacherId: string,
    date?: string,
    status?: ScheduleStatus[]
) => {
    const query: mongoose.FilterQuery<ISchedule> = {
        teacherId,
        // Use provided status or default to APPROVED and ACTIVE
        status: {$in: status && status.length > 0 ? status : [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
    };

    // Filter by date range if provided
    if (date) {
        const targetDate = new Date(date);
        query.effectiveFrom = {$lte: targetDate};
        query.$or = [
            {effectiveTo: {$exists: false}},
            {effectiveTo: {$gte: targetDate}},
        ];
    }

    const schedules = await ScheduleModel.find(query)
        .populate([
            {path: "courseId", select: "title subjectId startDate endDate"},
            {path: "timeSlotId"},
        ])
        .sort({dayOfWeek: 1})
        .lean();

    // Group by day of week
    const weeklySchedule: Record<string, any[]> = {};
    for (const day of Object.values(DayOfWeek)) {
        weeklySchedule[day] = schedules.filter((s: any) => s.dayOfWeek === day);
    }

    return weeklySchedule;
};

export const getCourseSchedule = async (courseId: string, status?: ScheduleStatus[]) => {
    return ScheduleModel.find({
        courseId,
        status: {$in: status || [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
    })
        .populate([
            {path: "teacherId", select: "fullname email"},
            {path: "timeSlotId"},
        ])
        .sort({dayOfWeek: 1})
        .lean();
};

/**
 * Approve or reject schedule request
 */
export const approveScheduleRequest = async (
    scheduleId: string,
    approved: boolean,
    adminId: mongoose.Types.ObjectId,
    approvalNote?: string
) => {
    // Verify the admin ID is actually an admin
    const admin = await UserModel.findById(adminId);
    appAssert(admin && admin.role === Role.ADMIN, NOT_FOUND, "Admin user not found");

    // FInd schedule
    const schedule = await ScheduleModel.findById(scheduleId);
    appAssert(schedule, NOT_FOUND, "Schedule not found");
    appAssert(
        schedule.status === ScheduleStatus.PENDING,
        BAD_REQUEST,
        "Schedule has already been processed"
    );

    // If approving, check for conflicts again (in case another schedule was approved meanwhile)
    if (approved) {
        const conflict = await ScheduleModel.findOne({
            _id: {$ne: scheduleId},
            teacherId: schedule.teacherId,
            dayOfWeek: schedule.dayOfWeek,
            timeSlotId: schedule.timeSlotId,
            status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
        });

        appAssert(
            !conflict,
            CONFLICT,
            "Teacher already has an approved course in this slot"
        );
    }

    schedule.status = approved ? ScheduleStatus.APPROVED : ScheduleStatus.REJECTED;
    schedule.approvedBy = adminId;
    schedule.approvedAt = new Date();
    schedule.approvalNote = approvalNote;

    await schedule.save();

    return schedule.populate([
        {path: "courseId", select: "title subjectId startDate endDate"},
        {path: "teacherId", select: "fullname email"},
        {path: "timeSlotId"},
        {path: "approvedBy", select: "fullname email"},
    ]);
};

/**
 * Get pending schedule requests
 */
export const getPendingScheduleRequests = async () => {
    return ScheduleModel.find({
        status: ScheduleStatus.PENDING,
    })
        .populate([
            {path: "courseId", select: "title subjectId startDate endDate"},
            {path: "teacherId", select: "fullname email"},
            {path: "timeSlotId"},
        ])
        .sort({requestedAt: -1})
        .lean();
};

/**
 * Create a schedule exception
 */
export const createScheduleException = async (input: CreateExceptionInput) => {
    const schedule = await ScheduleModel.findById(input.scheduleId);
    appAssert(schedule, NOT_FOUND, "Schedule not found");

    console.log(input);
    // Verify requester is the teacher of this schedule
    appAssert(
        schedule.teacherId.toString() === input.requestedBy.toString(),
        BAD_REQUEST,
        "You can only create exceptions for your own schedules"
    );

    // Check if exception already exists for this date
    const existingException = await ScheduleExceptionModel.findOne({
        scheduleId: input.scheduleId,
        exceptionDate: input.exceptionDate,
    });
    appAssert(!existingException, CONFLICT, "Exception already exists for this date");

    const exception = await ScheduleExceptionModel.create({
        scheduleId: input.scheduleId,
        courseId: schedule.courseId,
        exceptionDate: input.exceptionDate,
        exceptionType: input.exceptionType,
        newTimeSlotId: input.newTimeSlotId,
        newLocation: input.newLocation,
        replacementTeacherId: input.replacementTeacherId,
        reason: input.reason,
        status: ExceptionStatus.PENDING,
        requestedBy: input.requestedBy,
        requestedAt: new Date(),
        studentsNotified: false,
    });

    return exception.populate([
        {path: "scheduleId"},
        {path: "courseId", select: "title subjectId startDate endDate"},
        {path: "newTimeSlotId"},
        {path: "replacementTeacherId", select: "fullname email"},
    ]);
};

/**
 * Approve or reject schedule exception
 */
export const approveScheduleException = async (
    exceptionId: string,
    approved: boolean,
    adminId: mongoose.Types.ObjectId,
    approvalNote?: string
) => {
    // Verify the admin ID is actually an admin
    const admin = await UserModel.findById(adminId);
    appAssert(admin && admin.role === Role.ADMIN, NOT_FOUND, "Admin user not found");

    const exception = await ScheduleExceptionModel.findById(exceptionId);
    appAssert(exception, NOT_FOUND, "Exception not found");
    appAssert(
        exception.status === ExceptionStatus.PENDING,
        BAD_REQUEST,
        "Exception has already been processed"
    );

    exception.status = approved ? ExceptionStatus.APPROVED : ExceptionStatus.REJECTED;
    exception.approvedBy = adminId as any;
    exception.approvedAt = new Date();
    exception.approvalNote = approvalNote;

    await exception.save();

    // TODO: If approved, notify students about the change

    return exception.populate([
        {path: "scheduleId"},
        {path: "courseId", select: "title subjectId startDate endDate"},
        {path: "newTimeSlotId"},
        {path: "replacementTeacherId", select: "fullname email"},
        {path: "approvedBy", select: "fullname email"},
    ]);
};

/**
 * Get schedule with exceptions for a date range
 */
export const getScheduleWithExceptions = async (
    courseId: string,
    startDate: string,
    endDate: string
) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get recurring schedule
    const schedules = await ScheduleModel.find({
        courseId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
        effectiveFrom: {$lte: end},
        $or: [{effectiveTo: {$exists: false}}, {effectiveTo: {$gte: start}}],
    })
        .populate([
            {path: "teacherId", select: "fullname email"},
            {path: "timeSlotId"},
        ])
        .sort({dayOfWeek: 1})
        .lean();

    // Get exceptions in the date range
    const exceptions = await ScheduleExceptionModel.find({
        courseId,
        exceptionDate: {$gte: start, $lte: end},
        status: {$in: [ExceptionStatus.APPROVED, ExceptionStatus.ACTIVE]},
    })
        .populate([
            {path: "newTimeSlotId"},
            {path: "replacementTeacherId", select: "fullname email"},
        ])
        .sort({exceptionDate: 1})
        .lean();

    return {
        recurringSchedule: schedules,
        exceptions,
    };
};

/**
 * Check if a time slot is available for a teacher
 */
export const checkSlotAvailability = async (
    teacherId: string,
    dayOfWeek: string,
    timeSlotId: string
): Promise<boolean> => {
    const conflict = await ScheduleModel.findOne({
        teacherId,
        dayOfWeek,
        timeSlotId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
    });

    return !conflict; // Available if no conflict found
};