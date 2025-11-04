import mongoose from "mongoose";
import { IEnrollment } from "../types";
import {
  EnrollmentMethod,
  EnrollmentRole,
  EnrollmentStatus,
} from "@/types/enrollment.type";

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
    status: {
      type: String,
      enum: [
        EnrollmentStatus.PENDING,
        EnrollmentStatus.APPROVED,
        EnrollmentStatus.REJECTED,
        EnrollmentStatus.CANCELLED,
        EnrollmentStatus.DROPPED,
        EnrollmentStatus.COMPLETED,
      ],
      default: EnrollmentStatus.PENDING,
    },
    method: {
      type: String,
      enum: [
        EnrollmentMethod.SELF,
        EnrollmentMethod.INVITED,
        EnrollmentMethod.PASSWORD,
        EnrollmentMethod.OTHER,
      ],
      default: EnrollmentMethod.SELF,
    },
    role: {
      type: String,
      enum: [EnrollmentRole.STUDENT, EnrollmentRole.AUDITOR],
      default: EnrollmentRole.STUDENT,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    respondedAt: { type: Date },
    note: { type: String },
    progress: {
      totalLessons: { type: Number, default: 0 },
      completedLessons: { type: Number, default: 0 },
    },
    finalGrade: { type: Number },
    completedAt: { type: Date },
    droppedAt: { type: Date },
  },
  { timestamps: true }
);

//indexes
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, courseId: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, status: 1 });

const EnrollmentModel = mongoose.model<IEnrollment>(
  "Enrollment",
  EnrollmentSchema,
  "enrollments"
);

export default EnrollmentModel;
