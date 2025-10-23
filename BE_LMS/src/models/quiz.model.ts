import mongoose from "mongoose";
import { IQuizQuestion, IQuiz } from "../types";

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
