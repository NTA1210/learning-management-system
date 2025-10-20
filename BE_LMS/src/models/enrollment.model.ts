import mongoose from "mongoose";

export interface IEnrollment extends mongoose.Document {
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
