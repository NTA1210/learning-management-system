import mongoose from "mongoose";
import { ISubmission } from "../types";
import { SubmissionStatus } from "@/types/submission.type";

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
    originalName: { type: String, required: true },
    key: { type: String, required: true },
    mimeType: { type: String },
    size: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return v <= 20 * 1024 * 1024;
        },
        message: "File size must be <= 20MB",
      },
    },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number },
    feedback: { type: String },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },
    isLate: { type: Boolean, default: false },

    //status
    status: {
      type: String,
      enum: [
        SubmissionStatus.NOT_SUBMITTED,
        SubmissionStatus.SUBMITTED,
        SubmissionStatus.RESUBMITTED,
        SubmissionStatus.GRADED,
        SubmissionStatus.OVERDUE,
      ],
      default: SubmissionStatus.NOT_SUBMITTED,
    },
  },
  { timestamps: true } //auto thêm createdAt, updatedAt
);

//một sv chỉ có 1 submission / assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ assignmentId: 1, status: 1 });
SubmissionSchema.index({ studentId: 1, status: 1 });
SubmissionSchema.index({ gradedBy: 1, gradedAt: -1 });
SubmissionSchema.index({ assignmentId: 1, submittedAt: -1 });

//middleware ktra nộp trễ - (xem lại để có thể tinh chỉnh lại nếu như resubmit)
SubmissionSchema.pre("save", async function (next) {
  const Assignment = mongoose.model("Assignment");
  const assignment = await Assignment.findById(this.assignmentId);

  if (assignment?.dueDate && this.submittedAt > assignment.dueDate) {
    this.isLate = true;
    this.status = SubmissionStatus.OVERDUE;
  } else {
    this.isLate = false;
  }

  next();
});
//
SubmissionSchema.pre("save", function (next) {
  if (
    (this.isModified("grade") || this.isModified("feedback")) &&
    this.grade !== undefined
  ) {
    this.gradedAt = new Date();
    this.status = SubmissionStatus.GRADED;
  }
  next();
});

const SubmissionModel = mongoose.model<ISubmission>(
  "Submission",
  SubmissionSchema
);

export default SubmissionModel;
