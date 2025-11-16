import TimeSlotModel from "../models/timeSlot.model";
import ClassScheduleModel from "../models/classSchedule.model";
import ScheduleExceptionModel from "../models/scheduleException.model";
import ClassModel from "../models/class.model";
import {ScheduleStatus} from "../types/classSchedule.type";
import {ExceptionStatus, ExceptionType} from "../types/scheduleException.type";
import {DayOfWeek} from "../types/timeSlot.type";
import appAssert from "../utils/appAssert";
import {BAD_REQUEST, CONFLICT, NOT_FOUND} from "../constants/http";

export interface CreateScheduleInput {
    classId: string;
    teacherId: string;
    dayOfWeek: DayOfWeek;
    timeSlotId: string;
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
    replacementTeacherId?: string;
    reason: string;
    requestedBy: string;
}

export const getAllTimeSlots = async (filter: any = {}) => {
    return await TimeSlotModel.find(filter).sort({order: 1}).lean();
};

export const createScheduleRequest = async (input: CreateScheduleInput) => {
    // Verify class exists
    const classData = await ClassModel.findById(input.classId);
    appAssert(classData, NOT_FOUND, "Class not found");

    // Verify teacher is assigned to this class
    const isAssigned = classData.teacherIds.some(
        (id: any) => id.toString() === input.teacherId
    );
    appAssert(isAssigned, BAD_REQUEST, "Teacher is not assigned to this class");

    // Check if slot is available for this teacher
    const conflict = await ClassScheduleModel.findOne({
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        timeSlotId: input.timeSlotId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
    });

    appAssert(
        !conflict,
        CONFLICT,
        "Teacher already has a class scheduled in this slot"
    );

    const schedule = await ClassScheduleModel.create({
        ...input,
        status: ScheduleStatus.PENDING,
        requestedBy: input.teacherId,
        requestedAt: new Date(),
    });

    return schedule.populate([
        {path: "classId", select: "className courseId"},
        {path: "teacherId", select: "fullname email"},
        {path: "timeSlotId"},
    ]);
};

export const getTeacherWeeklySchedule = async (
    teacherId: string,
    date?: string
) => {
    const query: any = {
        teacherId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
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

    const schedules = await ClassScheduleModel.find(query)
        .populate([
            {path: "classId", select: "className courseId capacity"},
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

export const getClassSchedule = async (classId: string) => {
    return await ClassScheduleModel.find({
        classId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
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
    adminId: string,
    approvalNote?: string
) => {
    const schedule = await ClassScheduleModel.findById(scheduleId);

    appAssert(schedule, NOT_FOUND, "Schedule not found");

    appAssert(
        schedule.status === ScheduleStatus.PENDING,
        BAD_REQUEST,
        "Schedule has already been processed"
    );

    // If approving, check for conflicts again (in case another schedule was approved meanwhile)
    if (approved) {
        const conflict = await ClassScheduleModel.findOne({
            _id: {$ne: scheduleId},
            teacherId: schedule.teacherId,
            dayOfWeek: schedule.dayOfWeek,
            timeSlotId: schedule.timeSlotId,
            status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
        });

        appAssert(
            !conflict,
            CONFLICT,
            "Teacher already has an approved class in this slot"
        );
    }

    schedule.status = approved ? ScheduleStatus.APPROVED : ScheduleStatus.REJECTED;
    schedule.approvedBy = adminId as any;
    schedule.approvedAt = new Date();
    schedule.approvalNote = approvalNote;

    await schedule.save();

    return schedule.populate([
        {path: "classId", select: "className courseId"},
        {path: "teacherId", select: "fullname email"},
        {path: "timeSlotId"},
        {path: "approvedBy", select: "fullname email"},
    ]);
};

/**
 * Get pending schedule requests
 */
export const getPendingScheduleRequests = async () => {
    return ClassScheduleModel.find({
        status: ScheduleStatus.PENDING,
    })
        .populate([
            {path: "classId", select: "className courseId"},
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
    const schedule = await ClassScheduleModel.findById(input.scheduleId);

    appAssert(schedule, NOT_FOUND, "Schedule not found");

    // Verify requester is the teacher of this schedule
    appAssert(
        schedule.teacherId.toString() === input.requestedBy,
        BAD_REQUEST,
        "You can only create exceptions for your own schedules"
    );

    // Check if exception already exists for this date
    const existingException = await ScheduleExceptionModel.findOne({
        classScheduleId: input.scheduleId,
        exceptionDate: input.exceptionDate,
    });

    appAssert(!existingException, CONFLICT, "Exception already exists for this date");

    const exception = await ScheduleExceptionModel.create({
        classScheduleId: input.scheduleId,
        classId: schedule.classId,
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
        {path: "classScheduleId"},
        {path: "classId", select: "className courseId"},
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
    adminId: string,
    approvalNote?: string
) => {
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
        {path: "classScheduleId"},
        {path: "classId", select: "className courseId"},
        {path: "newTimeSlotId"},
        {path: "replacementTeacherId", select: "fullname email"},
        {path: "approvedBy", select: "fullname email"},
    ]);
};

/**
 * Get schedule with exceptions for a date range
 */
export const getScheduleWithExceptions = async (
    classId: string,
    startDate: string,
    endDate: string
) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get recurring schedule
    const schedules = await ClassScheduleModel.find({
        classId,
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
        classId,
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
    const conflict = await ClassScheduleModel.findOne({
        teacherId,
        dayOfWeek,
        timeSlotId,
        status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
    });

    return !conflict; // Available if no conflict found
};