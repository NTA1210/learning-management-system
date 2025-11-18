import mongoose from "mongoose";
import { QuizQuestionType } from "./quizQuestion.type";

export interface SnapshotQuestion {
  id: string;
  text: string;
  type: QuizQuestionType; // hoặc QuizQuestionType nếu bạn có enum
  options: string[];
  correctOptions: number[];
  images?: { url: string; fromDB: boolean }[];
  points: number;
  explanation?: string;
  isExternal: boolean;
  isNew: boolean;
  isDeleted: boolean;
  isDirty: boolean;
}

export default interface IQuiz extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  shuffleQuestions?: boolean;
  hashPassword?: string;
  // questionIds: mongoose.Types.ObjectId[];
  snapshotQuestions: SnapshotQuestion[];
  isPublished?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  // Methods
  generateHashPassword(): string;
  compareHashPassword(password: string): boolean;
}
