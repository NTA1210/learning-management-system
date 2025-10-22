import mongoose from "mongoose";
import { ISubmission } from "../types";

const SubmissionSchema = new mongoose.Schema<ISubmission>(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileUrl: { type: String },
    fileName: { type: String },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number },
    feedback: { type: String },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: false }
);

SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
export default mongoose.model<ISubmission>("Submission", SubmissionSchema);
