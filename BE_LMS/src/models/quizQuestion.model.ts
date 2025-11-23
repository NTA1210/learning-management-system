import IQuizQuestion, { QuizQuestionType } from '../types/quizQuestion.type';
import mongoose from 'mongoose';

export const QuizQuestionSchema = new mongoose.Schema<IQuizQuestion>(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    images: {
      type: [String],
      default: [],
    },

    type: {
      type: String,
      enum: QuizQuestionType,
      default: QuizQuestionType.MCQ,
    },
    options: { type: [String], required: true, default: [] },
    correctOptions: {
      type: [Number],
      required: true,
      default: [],
    },
    points: { type: Number, default: 1 },
    explanation: { type: String, trim: true },
  },
  { timestamps: true }
);

//Indexes
QuizQuestionSchema.index({ subjectId: 1, text: 1 });
QuizQuestionSchema.index({ text: 'text' });

const QuizQuestionModel = mongoose.model<IQuizQuestion>(
  'QuizQuestion',
  QuizQuestionSchema,
  'quiz_questions'
);

export default QuizQuestionModel;
