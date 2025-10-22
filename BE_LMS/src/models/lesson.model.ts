import mongoose from "mongoose";
import { ILesson } from "../types";

const LessonSchema = new mongoose.Schema<ILesson>(
  {
    title: { type: String, required: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    content: { type: String },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

LessonSchema.index({ course: 1, order: 1 });
export default mongoose.model<ILesson>("Lesson", LessonSchema);
