import mongoose from 'mongoose';
import { AttemptStatus, IQuestionAnswer, IQuiz, IQuizAttempt } from '../types';
import { QuizQuestionType } from '@/types/quizQuestion.type';
import { ImageSchema } from './quiz.model';

const QuestionAnswerSchema = new mongoose.Schema<IQuestionAnswer>(
  {
    questionId: { type: String, required: true },
    answer: { type: [Number], default: [] },
    text: { type: String },
    options: { type: [String], default: [] },
    type: { type: String, enum: QuizQuestionType, required: true },
    images: { type: [ImageSchema], default: [] },
    explanation: { type: String, trim: true, default: '' },
    correct: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema<IQuizAttempt>(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    answers: {
      type: [QuestionAnswerSchema],
      required: true,
      default: [],
    },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: AttemptStatus,
      default: AttemptStatus.IN_PROGRESS,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

//Indexes
QuizAttemptSchema.index({ quizId: 1, studentId: 1, startAt: -1 });
QuizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });
QuizAttemptSchema.index({ studentId: 1, status: 1 });
QuizAttemptSchema.index({ quizId: 1, submittedAt: -1 });

/** 🔥 Method chấm điểm */
QuizAttemptSchema.methods.grade = async function (answers: IQuestionAnswer[], quiz: IQuiz) {
  const attempt = this as IQuizAttempt;
  let totalScore = 0;

  // Duyệt qua từng câu trả lời
  answers!.forEach((ans) => {
    const question = quiz.snapshotQuestions.find(
      (q: any) => q.id.toString() === ans.questionId.toString()
    );

    if (!question) return;

    // So sánh mảng: người dùng chọn == đáp án đúng
    const isCorrect = JSON.stringify(ans.answer) === JSON.stringify(question.correctOptions);

    ans.correct = isCorrect;
    ans.pointsEarned = isCorrect ? question.points : 0;
    ans.explanation = question.explanation;

    if (isCorrect) totalScore += question.points;
  });
  const totalQuestions = quiz.snapshotQuestions.length;
  const totalQuizScore = quiz.snapshotQuestions.reduce((total, q) => total + q.points, 0);
  const scorePercentage = (totalScore / totalQuizScore) * 10;

  attempt.score = scorePercentage;
  attempt.status = AttemptStatus.SUBMITTED;
  attempt.submittedAt = new Date();
  attempt.answers = answers;
  attempt.durationSeconds = (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000;

  const failedQuestions = answers.filter((a) => !a.correct).length;
  const passedQuestions = answers.filter((a) => a.correct).length;

  await attempt.save();
  return {
    totalQuestions,
    totalScore,
    totalQuizScore,
    scorePercentage,
    failedQuestions,
    passedQuestions,
    answers,
  };
};

const QuizAttemptModel = mongoose.model<IQuizAttempt>(
  'QuizAttempt',
  QuizAttemptSchema,
  'quizAttempts'
);

export default QuizAttemptModel;
