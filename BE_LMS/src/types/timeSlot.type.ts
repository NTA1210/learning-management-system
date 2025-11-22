import mongoose from "mongoose";

export enum DayOfWeek {
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday",
    SUNDAY = "sunday",
}

export default interface ITimeSlot extends mongoose.Document {
    /**
     * Slot identifier (e.g., "Slot 1", "Slot 2")
     */
    slotNumber: number;

    /**
     * Display name for the slot
     */
    slotName: string;

    /**
     * Start time in 24-hour format (e.g., "07:00")
     */
    startTime: string;

    /**
     * End time in 24-hour format (e.g., "09:00")
     */
    endTime: string;

    /**
     * Duration in minutes (e.g., 120 for 2 hours)
     */
    duration: number;

    /**
     * Whether this slot is active/available for scheduling
     */
    isActive: boolean;

    /**
     * Display order for UI
     */
    order: number;

    /**
     * Optional: Day-specific slots (if different slots on different days)
     */
    applicableDays?: DayOfWeek[];

    /**
     * Audit fields
     */
    createdBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}