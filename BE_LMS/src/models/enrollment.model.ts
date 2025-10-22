import mongoose from "mongoose";
import { IEnrollment } from "../types";

const EnrollmentSchema = new mongoose.Schema<IEnrollment>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    role: { type: String, enum: ["student", "auditor"], default: "student" },
    finalGrade: { type: Number },
    grades: [
      {
        assignmentId: { type: mongoose.Schema.Types.ObjectId },
        grade: { type: Number },
        note: { type: String },
      },
    ],
  },
  { timestamps: false }
);

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
export default mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
