import mongoose from "mongoose";
import IQuizQuestion from "./quizQuestion.type";

export default interface IQuiz extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  shuffleQuestions?: boolean;
  questionIds: mongoose.Types.ObjectId[];
  snapshotQuestions: IQuizQuestion[] | [];
  isPublished?: boolean;
  isCompleted?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  createSnapshot(): void;
}
