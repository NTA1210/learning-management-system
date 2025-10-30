import mongoose from "mongoose";
import { AttemptStatus, IQuestionAnswer, IQuiz, IQuizAttempt } from "../types";
import QuizModel from "./quiz.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND } from "../constants/http";

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
      ref: "Quiz",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    durationSeconds: { type: Number },
    answers: {
      type: [QuestionAnswerSchema],
      default: [],
    },
    score: { type: Number },
    status: {
      type: String,
      enum: [
        AttemptStatus.COMPLETED,
        AttemptStatus.IN_PROGRESS,
        AttemptStatus.SUBMITTED,
        AttemptStatus.ABANDONED,
      ],
      default: AttemptStatus.IN_PROGRESS,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

//Indexes
QuizAttemptSchema.index({ quizId: 1, studentId: 1, startAt: -1 });
QuizAttemptSchema.index({ studentId: 1, status: 1 });
QuizAttemptSchema.index({ quizId: 1, submittedAt: -1 });

/** 🔥 Method chấm điểm */
QuizAttemptSchema.methods.grade = async function () {
  const attempt = this as IQuizAttempt;

  const quiz = await QuizModel.findById(attempt.quizId);
  appAssert(quiz, NOT_FOUND, "Quiz not found");

  let totalScore = 0;

  // Duyệt qua từng câu trả lời
  attempt.answers!.forEach((ans) => {
    const question = quiz.snapshotQuestions.find(
      (q: any) => q._id.toString() === ans.questionId.toString()
    );

    if (!question) return;

    // So sánh mảng: người dùng chọn == đáp án đúng
    const isCorrect =
      JSON.stringify(ans.answer) === JSON.stringify(question.correctOptions);

    ans.correct = isCorrect;
    ans.pointsEarned = isCorrect ? question.points : 0;

    if (isCorrect) totalScore += question.points;
  });

  attempt.score = totalScore;
  attempt.status = AttemptStatus.COMPLETED;
  attempt.submittedAt = new Date();

  await attempt.save();
  return { totalScore, answers: attempt.answers };
};

QuizAttemptSchema.index({ quizId: 1, studentId: 1 });
const QuizAttemptModel = mongoose.model<IQuizAttempt>(
  "QuizAttempt",
  QuizAttemptSchema,
  "quizAttempts"
);

export default QuizAttemptModel;
