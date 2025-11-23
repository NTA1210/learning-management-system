import mongoose from "mongoose";

export const enum AttendanceStatus {
    NOTYET = "notyet",
    PRESENT = "present",
    ABSENT = "absent",
}

export default interface IAttendance extends mongoose.Document {
    courseId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    date: Date;
    status: AttendanceStatus;
    markedBy?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
