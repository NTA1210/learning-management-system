import mongoose from "mongoose";

export type QuestionType =
  | "mcq"
  | "multi"
  | "truefalse"
  | "essay"
  | "fillblank";

export interface IQuizQuestion {
  text: string;
  type: QuestionType;
  options?: string[]; // for MCQ
  correct?: any; // for auto-graded (index or array)
  points?: number;
  explanation?: string;
}

export default interface IQuiz extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  questions: IQuizQuestion[];
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
