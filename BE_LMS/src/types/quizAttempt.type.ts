import mongoose from "mongoose";

export interface IQuestionAnswer {
  questionId: mongoose.Types.ObjectId | string; // question _id inside quiz
  answer: any; // depends on question type
  correct?: boolean;
  pointsEarned?: number;
}

export default interface IQuizAttempt extends mongoose.Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  durationSeconds?: number;
  answers?: IQuestionAnswer[];
  score?: number;
  status: "in_progress" | "completed" | "abandoned";
  ipAddress?: string;
  userAgent?: string;
}
