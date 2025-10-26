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

// Indexes for better performance
LessonSchema.index({ courseId: 1, order: 1 });
LessonSchema.index({ title: 1 });
LessonSchema.index({ publishedAt: 1 });

// Text search index for better search performance
LessonSchema.index({ 
  title: "text", 
  content: "text" 
});

const LessonModel = mongoose.model<ILesson>("Lesson", LessonSchema);

export default LessonModel;
