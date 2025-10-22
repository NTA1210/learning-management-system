import mongoose from "mongoose";

export default interface IEnrollment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: "active" | "completed" | "dropped";
  role?: "student" | "auditor";
  finalGrade?: number;
  grades?: {
    assignmentId?: mongoose.Types.ObjectId;
    grade: number;
    note?: string;
  }[];
}
