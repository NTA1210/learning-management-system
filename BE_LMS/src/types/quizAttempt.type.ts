import mongoose from "mongoose";

export enum AttemptStatus {
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  ABANDONED = "abandoned",
}

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
  answers?: IQuestionAnswer[] | [];
  score?: number;
  status: AttemptStatus;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  grade(): any;
}
