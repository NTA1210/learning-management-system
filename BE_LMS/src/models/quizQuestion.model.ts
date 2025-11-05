import IQuizQuestion, { QuizQuestionType } from "../types/quizQuestion.type";
import mongoose from "mongoose";

export const QuizQuestionSchema = new mongoose.Schema<IQuizQuestion>(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    image: { type: String },
    type: {
      type: String,
      enum: [
        QuizQuestionType.MCQ,
        QuizQuestionType.MULTIPLE_CHOICE,
        QuizQuestionType.TRUE_FALSE,
        QuizQuestionType.FILL_BLANK,
      ],
      default: QuizQuestionType.MCQ,
    },
    options: [String],
    correctOptions: [{ type: Number }],
    points: { type: Number, default: 1 },
    explanation: { type: String },
  },
  { timestamps: true }
);

//Indexes
QuizQuestionSchema.index({ subjectId: 1, text: 1 });
QuizQuestionSchema.index({ text: "text" });

const QuizQuestionModel = mongoose.model<IQuizQuestion>(
  "QuizQuestion",
  QuizQuestionSchema,
  "quiz_questions"
);

export default QuizQuestionModel;
