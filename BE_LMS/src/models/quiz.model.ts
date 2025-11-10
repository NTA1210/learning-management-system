import mongoose from "mongoose";
import { IQuiz } from "../types";
import QuizQuestionModel from "./quizQuestion.model";
import cron from "node-cron";

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
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    shuffleQuestions: { type: Boolean, default: false },
    questionIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },
    ],
    snapshotQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isPublished: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

//Indexes
QuizSchema.index({ courseId: 1, isPublished: 1, createdAt: -1 });
QuizSchema.index({ courseId: 1, title: 1 });
QuizSchema.index({ isCompleted: 1, questionIds: 1 });

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
    isExternal: false,
  }));

  await this.save();
};

// Method: Thêm snapshot questions (object)
QuizSchema.methods.addSnapshotQuestions = async function (questions: any[]) {
  await this.updateOne({
    $push: { snapshotQuestions: { $each: questions } },
  });
};

const QuizModel = mongoose.model<IQuiz>("Quiz", QuizSchema, "quizzes");

export default QuizModel;

//Chạy mỗi phút kiểm tra quiz đã hết thời gian

cron.schedule("0 */5 * * * *", async () => {
  console.log("🚀 Running daily quiz cleanup task...");
  const quizzes = await QuizModel.updateMany(
    { endTime: { $lt: new Date() }, isCompleted: false },
    { isCompleted: true }
  );

//   if (quizzes.modifiedCount > 0) {
//     console.log(`✅ Updated ${quizzes.modifiedCount} completed quizzes.`);
//   }
// });
