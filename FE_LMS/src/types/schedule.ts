// Schedule Types

export const DayOfWeek = {
    MONDAY: "monday",
    TUESDAY: "tuesday",
    WEDNESDAY: "wednesday",
    THURSDAY: "thursday",
    FRIDAY: "friday",
    SATURDAY: "saturday",
    SUNDAY: "sunday",
} as const;
export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

export const ScheduleStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    ACTIVE: "active",
    INACTIVE: "inactive",
} as const;
export type ScheduleStatus = typeof ScheduleStatus[keyof typeof ScheduleStatus];

export const ExceptionType = {
    CANCELLATION: "cancellation",
    RESCHEDULE: "reschedule",
    REPLACEMENT: "replacement",
    ROOM_CHANGE: "room_change",
} as const;
export type ExceptionType = typeof ExceptionType[keyof typeof ExceptionType];

export const ExceptionStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    ACTIVE: "active",
} as const;
export type ExceptionStatus = typeof ExceptionStatus[keyof typeof ExceptionStatus];

// Time Slot Types
export interface TimeSlot {
    _id: string;
    slotNumber: number;
    slotName: string;
    startTime: string; // "HH:mm" format
    endTime: string; // "HH:mm" format
    duration: number; // minutes
    isActive: boolean;
    order: number;
    applicableDays?: DayOfWeek[];
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Teacher reference in schedule
export interface ScheduleTeacher {
    _id: string;
    email: string;
    fullname: string;
}

// Course reference in schedule
export interface ScheduleCourse {
    _id: string;
    title: string;
    subjectId?: string;
    startDate: string;
    endDate: string;
}

// Schedule Types
export interface Schedule {
    _id: string;
    courseId: ScheduleCourse | string;
    teacherId: ScheduleTeacher | string;
    dayOfWeek: DayOfWeek;
    timeSlotId: TimeSlot | string;
    status: ScheduleStatus;
    effectiveFrom: string;
    effectiveTo?: string;
    location?: string;
    requestedBy: string;
    requestedAt: string;
    requestNote?: string;
    approvedBy?: string;
    approvedAt?: string;
    approvalNote?: string;
    recurrencePattern?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Teacher weekly schedule - grouped by day
export interface TeacherWeeklySchedule {
    monday: Schedule[];
    tuesday: Schedule[];
    wednesday: Schedule[];
    thursday: Schedule[];
    friday: Schedule[];
    saturday: Schedule[];
    sunday: Schedule[];
}

// Schedule Exception Types
export interface ScheduleException {
    _id: string;
    scheduleId: string;
    courseId: ScheduleCourse | string;
    exceptionDate: string;
    exceptionType: ExceptionType;
    status: ExceptionStatus;
    newTimeSlotId?: TimeSlot | string;
    newLocation?: string;
    replacementTeacherId?: ScheduleTeacher | string;
    reason: string;
    requestedBy: string;
    requestedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    approvalNote?: string;
    studentsNotified: boolean;
    notifiedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// API Response Types
export interface TimeSlotResponse {
    success: boolean;
    message: string;
    data: TimeSlot[];
    meta: {
        timestamp: string;
        timezone: string;
    };
}

export interface ScheduleResponse {
    success: boolean;
    message: string;
    data: Schedule[];
    meta: {
        timestamp: string;
        timezone: string;
    };
}

export interface TeacherScheduleResponse {
    success: boolean;
    message: string;
    data: TeacherWeeklySchedule;
    meta: {
        timestamp: string;
        timezone: string;
    };
}

export interface SingleScheduleResponse {
    success: boolean;
    message: string;
    data: Schedule;
    meta: {
        timestamp: string;
        timezone: string;
    };
}

export interface ScheduleExceptionResponse {
    success: boolean;
    message: string;
    data: ScheduleException[];
    meta: {
        timestamp: string;
        timezone: string;
    };
}

export interface SingleExceptionResponse {
    success: boolean;
    message: string;
    data: ScheduleException;
    meta: {
        timestamp: string;
        timezone: string;
    };
}

// Schedule slot item for creating multiple slots
export interface ScheduleSlotItem {
    dayOfWeek: DayOfWeek;
    timeSlotId: string;
}

// Create schedule request - uses slots array for multiple day/time combinations
export interface CreateScheduleRequest {
    courseId: string;
    slots: ScheduleSlotItem[];
    effectiveFrom: string; // YYYY-MM-DD
    effectiveTo?: string;
    location?: string;
    requestNote?: string;
}

export interface ApproveScheduleRequest {
    approved: boolean;
    approvalNote?: string;
}

export interface CreateExceptionRequest {
    exceptionDate: string; // YYYY-MM-DD
    exceptionType: ExceptionType;
    newTimeSlotId?: string;
    newLocation?: string;
    replacementTeacherId?: string;
    reason?: string;
}

export interface ApproveExceptionRequest {
    approved: boolean;
    approvalNote?: string;
}

// Utility type for checking availability
export interface AvailabilityCheck {
    dayOfWeek: DayOfWeek;
    timeSlotId: string;
    teacherId: string;
}

// Helper type for calendar display
export interface CalendarScheduleItem {
    id: string;
    type: 'schedule' | 'exception';
    title: string;
    courseName: string;
    teacherName: string;
    location?: string;
    startTime: string;
    endTime: string;
    dayOfWeek: DayOfWeek;
    status: ScheduleStatus | ExceptionStatus;
    date?: Date; // For specific date items
    originalSchedule?: Schedule;
    exception?: ScheduleException;
}
