import mongoose from "mongoose";
import { IAttendance } from "../types";

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
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: false }
);

AttendanceSchema.index(
  { courseId: 1, studentId: 1, date: 1 },
  { unique: true }
);
export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);
