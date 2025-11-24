import mongoose from 'mongoose';
import { AttemptStatus, IQuestionAnswer, IQuiz, IQuizAttempt } from '../types';
import { Answer } from '@/validators/quizAttempt.schemas';

const QuestionAnswerSchema = new mongoose.Schema<IQuestionAnswer>(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    answer: { type: [Number], default: [] },
    correct: { type: Boolean },
    pointsEarned: { type: Number },
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
QuizAttemptSchema.methods.grade = async function (answers: Answer[], quiz: IQuiz) {
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
