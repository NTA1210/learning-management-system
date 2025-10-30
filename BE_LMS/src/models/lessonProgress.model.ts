import { ILessonProgress } from "@/types/lessonProgress.type";
import mongoose from "mongoose";

const LessonProgressSchema = new mongoose.Schema<ILessonProgress>(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    timeSpentSeconds: { type: Number },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

//Indexes
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ lessonId: 1, completedAt: 1 });
LessonProgressSchema.index({ userId: 1, courseId: 1 });
LessonProgressSchema.index({ courseId: 1, isCompleted: 1 });

//Hooks
LessonProgressSchema.pre("save", function (next) {
  if (this.isModified("isCompleted") && this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const LessonProgressModel = mongoose.model<ILessonProgress>(
  "LessonProgress",
  LessonProgressSchema,
  "lessonProgresses"
);

export default LessonProgressModel;
