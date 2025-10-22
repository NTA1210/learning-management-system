import mongoose from "mongoose";
import { IQuestionAnswer, IQuizAttempt } from "../types";

const QuestionAnswerSchema = new mongoose.Schema<IQuestionAnswer>(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    answer: { type: mongoose.Schema.Types.Mixed },
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
    answers: [QuestionAnswerSchema],
    score: { type: Number },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

// Method to compute score given quiz doc (auto-grading)
QuizAttemptSchema.methods.computeScore = function (quizDoc: any) {
  if (!quizDoc || !quizDoc.questions) return 0;
  let total = 0;
  let earned = 0;
  const qMap = new Map();
  for (const q of quizDoc.questions) {
    qMap.set(q._id?.toString() ?? q._id, q);
    total += q.points ?? 1;
  }
  if (!this.answers) return 0;
  for (const a of this.answers) {
    const q = qMap.get(a.questionId.toString?.() ?? a.questionId);
    if (!q) continue;
    const qPoints = q.points ?? 1;
    // naive compare for MCQ/string/truefalse
    let isCorrect = false;
    if (q.type === "essay") {
      isCorrect = false; // requires manual grading
    } else {
      try {
        // simple equality or array equality
        if (Array.isArray(q.correct) && Array.isArray(a.answer)) {
          isCorrect =
            q.correct.length === a.answer.length &&
            q.correct.every((v: any) => a.answer.includes(v));
        } else {
          isCorrect = JSON.stringify(q.correct) === JSON.stringify(a.answer);
        }
      } catch (err) {
        isCorrect = false;
      }
    }
    if (isCorrect) {
      earned += qPoints;
      a.correct = true;
      a.pointsEarned = qPoints;
    } else {
      a.correct = false;
      a.pointsEarned = 0;
    }
  }
  this.score = earned;
  return { total, earned };
};

QuizAttemptSchema.index({ quizId: 1, studentId: 1 });
export default mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
