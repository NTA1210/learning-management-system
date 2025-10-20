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

export interface IQuiz extends mongoose.Document {
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

const QuizQuestionSchema = new mongoose.Schema<IQuizQuestion>(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["mcq", "multi", "truefalse", "essay", "fillblank"],
      default: "mcq",
    },
    options: [String],
    correct: { type: mongoose.Schema.Types.Mixed },
    points: { type: Number, default: 1 },
    explanation: { type: String },
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema<IQuiz>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    timeLimitMinutes: { type: Number },
    shuffleQuestions: { type: Boolean, default: false },
    questions: [QuizQuestionSchema],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuizSchema.index({ courseId: 1, title: 1 });
export default mongoose.model<IQuiz>("Quiz", QuizSchema);
