import mongoose from "mongoose";
import { ICourse } from "../types";
import { CourseStatus } from "@/types/course.type";

const CourseSchema = new mongoose.Schema<ICourse>(
  {
    title: { type: String, required: true },
    code: { type: String },
    logo: { type: String },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date) {
          return value > this.startDate;
        },
        message: "EndDate must be greater than StartDate",
      },
    },
    status: {
      type: String,
      required: true,
      enum: [CourseStatus.DRAFT, CourseStatus.ONGOING, CourseStatus.COMPLETED],
      default: CourseStatus.DRAFT,
    },
    teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    specialistIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Specialist" },
    ],
    isPublished: { type: Boolean, default: false },
    capacity: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },
    enrollRequiresApproval: { type: Boolean, default: false },
    enrollPasswordHash: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Soft delete fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

//indexes
CourseSchema.index({ code: 1 }, { unique: true, sparse: true });
CourseSchema.index({ isPublished: 1, createdAt: -1 });
CourseSchema.index({ specialistIds: 1, isPublished: 1, createdAt: -1 });
CourseSchema.index({ teacherIds: 1, isPublished: 1, createdAt: -1 });
CourseSchema.index({ isPublished: 1, title: "text", description: "text" });
// Soft delete indexes
CourseSchema.index({ isDeleted: 1, createdAt: -1 });
CourseSchema.index({ isDeleted: 1, isPublished: 1, createdAt: -1 });

const CourseModel = mongoose.model<ICourse>("Course", CourseSchema, "courses");

export default CourseModel;
