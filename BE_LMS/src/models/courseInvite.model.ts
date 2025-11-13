import mongoose from "mongoose";
import ICourseInvite from "../types/courseInvite.type";

const CourseInviteSchema = new mongoose.Schema<ICourseInvite>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maxUses: {
      type: Number,
      default: null, // null = unlimited uses
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes để tối ưu query
CourseInviteSchema.index({ tokenHash: 1 }, { unique: true });
CourseInviteSchema.index({ courseId: 1, isActive: 1 });
CourseInviteSchema.index({ expiresAt: 1, isActive: 1 });

const CourseInviteModel = mongoose.model<ICourseInvite>(
  "CourseInvite",
  CourseInviteSchema,
  "course_invites"
);

export default CourseInviteModel;

