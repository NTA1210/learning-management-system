import mongoose from "mongoose";

export default interface IAttendance extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  markedBy?: mongoose.Types.ObjectId;
}
