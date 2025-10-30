import mongoose from "mongoose";
import { IQuiz } from "../types";
import QuizQuestionModel from "./quizQuestion.model";

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
    questionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },
    ],
    snapshotQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//Indexes
QuizSchema.index({ courseId: 1, isPublished: 1, createdAt: -1 });

//methods create snapshot questions
QuizSchema.methods.createSnapshot = async function () {
  const questions = await QuizQuestionModel.find({
    _id: { $in: this.questionIds },
  });

  this.snapshotQuestions = questions.map((q) => ({
    id: q._id,
    text: q.text,
    type: q.type,
    options: q.options,
    correctOptions: q.correctOptions,
    points: q.points,
    explanation: q.explanation,
  }));

  await this.save();
};

QuizSchema.index({ courseId: 1, title: 1 });
const QuizModel = mongoose.model<IQuiz>("Quiz", QuizSchema, "quizzes");

export default QuizModel;
