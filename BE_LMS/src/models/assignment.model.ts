import mongoose from "mongoose";
import { IAssignment } from "../types";

const AssignmentSchema = new mongoose.Schema<IAssignment>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    maxScore: { type: Number, default: 10 },
    dueDate: { type: Date },
    allowLate: { type: Boolean, default: false },
    // Optional attached file metadata for the assignment (uploaded by teacher)
    fileOriginalName: { type: String },
    fileMimeType: { type: String },
    fileKey: { type: String },
    fileSize: { type: Number },
  },
  { timestamps: true }
);

//Indexes
AssignmentSchema.index({ courseId: 1, dueDate: 1 });
AssignmentSchema.index({ courseId: 1, createdAt: -1 });

const AssignmentModel = mongoose.model<IAssignment>(
  "Assignment",
  AssignmentSchema,
  "assignments"
);

export default AssignmentModel;
