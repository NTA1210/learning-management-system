import mongoose from "mongoose";

export enum QuizQuestionType {
  MCQ = "mcq",
  MULTIPLE_CHOICE = "multichoice",
  TRUE_FALSE = "true_false",
  FILL_BLANK = "fill_blank",
}

export default interface IQuizQuestion extends mongoose.Document {
  subjectId: mongoose.Types.ObjectId;
  text: string;
  image?: string;
  key?: string;
  type: QuizQuestionType;
  options: string[]; // for MCQ
  correctOptions: any; // for auto-graded (index or array)
  points: number | 0;
  explanation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
