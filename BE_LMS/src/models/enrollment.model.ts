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
        EnrollmentStatus.PENDING, //enrollment chưa được duyệt vào nhóm
        EnrollmentStatus.APPROVED, //enrollment đa được duyệt vào nhóm
        EnrollmentStatus.REJECTED, //enrollment bị từ chối duyệt vào nhóm
        EnrollmentStatus.CANCELLED, // student hủy enrollment
        EnrollmentStatus.DROPPED, // student bị đánh rớt khóa học
        EnrollmentStatus.COMPLETED, // student hoàn thành khóa học
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
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1, courseId: 1, status: 1 });
EnrollmentSchema.index({ userId: 1, status: 1 });

const EnrollmentModel = mongoose.model<IEnrollment>(
  "Enrollment",
  EnrollmentSchema,
  "enrollments"
);

export default EnrollmentModel;
