import mongoose from "mongoose";
import {IAttendance} from "../types";
import {AttendanceStatus} from "../types/attendance.type";

const AttendanceSchema = new mongoose.Schema<IAttendance>(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        date: {type: Date, required: true, index: true},
        status: {
            type: String,
            enum: [
                AttendanceStatus.NOTYET,
                AttendanceStatus.PRESENT,
                AttendanceStatus.ABSENT,
            ],
            default: AttendanceStatus.NOTYET,
        },
        markedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    },
    {timestamps: true}
);

AttendanceSchema.index(
    {courseId: 1, studentId: 1, date: 1},
    {unique: true}
);
const AttendanceModel = mongoose.model<IAttendance>(
    "Attendance",
    AttendanceSchema
);

export default AttendanceModel;
