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
  isCompleted?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  // Methods
  // createSnapshot(): Promise<IQuiz>;
  addSnapshotQuestions(questions: SnapshotQuestion[]): Promise<void>;
  updateSnapshotQuestions(diff: {
    updated: Partial<SnapshotQuestion>[];
    added: SnapshotQuestion[];
    deleted: { id: string }[];
  }): Promise<void>;
}
