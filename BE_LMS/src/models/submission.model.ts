import mongoose from "mongoose";
import ISubmission, { SubmissionStatus } from "../types/submission.type";

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
        validator: (v: number) => v <= 20 * 1024 * 1024,
        message: "File size must be <= 20MB",
      },
    },
    submittedAt: { type: Date, default: Date.now },

    // 🧩 Điểm hiện tại (latest grade)
    grade: {
      type: Number,
      min: [0, "Grade must be >= 0"],
      max: [10, "Grade must be <= 10"],
    },
    feedback: { type: String },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gradedAt: { type: Date },

    // 🆕 Lưu lịch sử chấm điểm
    gradeHistory: {
      type: [
        {
          grade: {
            type: Number,
            required: true,
            min: [0, "Grade must be >= 0"],
            max: [10, "Grade must be <= 10"],
          },
          feedback: { type: String },
          gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          gradedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // 🧩 Trạng thái bài nộp
    isLate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.NOT_SUBMITTED,
    },
  },
  { timestamps: true }
);

// 🧩 Indexes
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ assignmentId: 1, status: 1 });
SubmissionSchema.index({ studentId: 1, status: 1 });
SubmissionSchema.index({ gradedBy: 1, gradedAt: -1 });
SubmissionSchema.index({ assignmentId: 1, submittedAt: -1 });

// 🧩 Middleware kiểm tra nộp trễ
SubmissionSchema.pre("save", async function (next) {
  const Assignment = mongoose.model("Assignment");
  const assignment: any = await Assignment.findById(this.assignmentId);

  if (assignment?.dueDate && this.submittedAt > assignment.dueDate) {
    this.isLate = true;
    this.status = SubmissionStatus.OVERDUE;
  } else {
    this.isLate = false;
  }

  next();
});

// 🧩 Middleware tự động cập nhật gradedAt & gradeHistory
SubmissionSchema.pre<ISubmission>("save", function (next) {
  if (
    (this.isModified("grade") || this.isModified("feedback")) &&
    this.grade !== undefined &&
    this.gradedBy !== undefined
  ) {
    this.gradedAt = new Date();
    this.status = SubmissionStatus.GRADED;

    if (!this.gradeHistory) this.gradeHistory = [];
    this.gradeHistory.push({
      grade: this.grade,
      feedback: this.feedback || "",
      gradedBy: this.gradedBy,
      gradedAt: new Date(),
    });
  }
  next();
});

const SubmissionModel = mongoose.model<ISubmission>(
  "Submission",
  SubmissionSchema
);

export default SubmissionModel;
