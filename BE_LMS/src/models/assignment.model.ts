import mongoose from "mongoose";
import { IAssignment } from "../types";

const AssignmentSchema = new mongoose.Schema<IAssignment>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    maxScore: { type: Number, default: 100 },
    dueDate: { type: Date },
    allowLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AssignmentSchema.index({ courseId: 1 });
export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);
