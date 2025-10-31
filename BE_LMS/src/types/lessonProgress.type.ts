import mongoose from "mongoose";

export interface ILessonProgress extends Document {
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  timeSpentSeconds?: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
