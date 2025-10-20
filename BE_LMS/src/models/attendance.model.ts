import mongoose from "mongoose";

export interface IAttendance extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  markedBy?: mongoose.Types.ObjectId;
}

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
