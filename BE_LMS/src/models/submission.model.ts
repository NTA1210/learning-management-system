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

    //status
    status: {
      type: String,
      enum: ["not_submitted", "submitted", "graded", "overdue"],
      default: "submitted",
    },
  },
  { timestamps: true } //auto thêm createdAt, updatedAt
);

//một sv chỉ có 1 submission / assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

//middleware ktra nộp trễ
SubmissionSchema.pre("save", async function (next) {
  const Assignment = mongoose.model("Assignment");
  const assignment = await Assignment.findById(this.assignmentId);

  if (assignment?.dueDate && this.submittedAt > assignment.dueDate) {
    this.isLate = true;
    this.status = "overdue";
  } else {
    this.isLate = false;
  }

  next();
});

export default mongoose.model<ISubmission>("Submission", SubmissionSchema);
