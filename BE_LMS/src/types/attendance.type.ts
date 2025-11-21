import mongoose from "mongoose";

export const enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    EXCUSED = "excused",
}

export default interface IAttendance extends mongoose.Document {
    courseId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    date: Date;
    status: AttendanceStatus;
    markedBy?: mongoose.Types.ObjectId;
}
