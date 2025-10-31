import mongoose from "mongoose";
import IQuizQuestion from "./quizQuestion.type";

export default interface IQuiz extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  questionIds: mongoose.Types.ObjectId[];
  snapshotQuestions: IQuizQuestion[] | [];
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createSnapshot(): void;
}
