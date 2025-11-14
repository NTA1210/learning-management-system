import mongoose from "mongoose";
import { IQuiz, SnapshotQuestion } from "../types";
import QuizQuestionModel from "./quizQuestion.model";
import cron from "node-cron";
import { getKeyFromPublicUrl, removeFiles } from "@/utils/uploadFile";
import { QuizQuestionType } from "@/types/quizQuestion.type";

export type TImage = {
  url: string;
  fromDB: boolean;
};

const ImageSchema = {
  url: { type: String, required: true },
  fromDB: { type: Boolean, default: false },
};

const SnapshotQuestionSchema = new mongoose.Schema<SnapshotQuestion>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: QuizQuestionType, required: true },
    options: { type: [String], required: true },
    correctOptions: { type: [Number], required: true },
    images: { type: [ImageSchema], default: [] },
    points: { type: Number, default: 1 },
    explanation: { type: String },
    isExternal: { type: Boolean, default: true },
    isNew: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isDirty: { type: Boolean, default: false },
  },
  { _id: false } // tắt _id riêng cho sub-doc
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
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    shuffleQuestions: { type: Boolean, default: false },
    hashPassword: { type: String },
    // questionIds: [
    //   { type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" },
    // ],
    snapshotQuestions: {
      type: [SnapshotQuestionSchema],
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
// QuizSchema.index({ isCompleted: 1, questionIds: 1 });

// 1️⃣ Create snapshot
// QuizSchema.methods.createSnapshot = async function () {
//   const questions = await QuizQuestionModel.find({
//     _id: { $in: this.questionIds },
//   });

//   const snapshotQuestions: SnapshotQuestion[] = questions.map((q) => ({
//     id: q.id,
//     text: q.text,
//     type: q.type,
//     options: q.options,
//     correctOptions: q.correctOptions,
//     images: q.images?.map((image) => ({ url: image, fromDB: true })),
//     points: q.points,
//     explanation: q.explanation,
//     isNew: false,
//     isDeleted: false,
//     isDirty: false,
//     isExternal: false,
//   }));

//   this.snapshotQuestions = [...snapshotQuestions, ...this.snapshotQuestions];

//   return await this.save();
// };

// 2️⃣ Add snapshot questions
// QuizSchema.methods.addSnapshotQuestions = async function (
//   questions: SnapshotQuestion[]
// ) {
//   this.snapshotQuestions.push(...questions);
//   await this.save();
// };

// // 3️⃣ Update snapshot questions
// QuizSchema.methods.updateSnapshotQuestions = async function (diff: {
//   updated: Partial<SnapshotQuestion>[];
//   added: SnapshotQuestion[];
//   deleted: SnapshotQuestion[];
// }) {
//   let deletedImages: string[] = [];
//   const map = new Map();
//   this.snapshotQuestions.forEach((q: SnapshotQuestion, i: number) =>
//     map.set(q.id, i)
//   );

//   // 1️⃣ Update existing questions
//   for (const q of diff.updated) {
//     const index = map.get(q.id);
//     if (index === -1) continue;

//     const oldQuestion = this.snapshotQuestions[index];
//     const oldImages = oldQuestion.images || [];
//     const newImages = q.images || [];

//     // Merge các field khác
//     this.snapshotQuestions[index] = {
//       ...oldQuestion,
//       ...q,
//     };

//     // Merge ảnh: giữ ảnh DB, add ảnh mới FE
//     const mergedImages = [...newImages];
//     this.snapshotQuestions[index].images = mergedImages;

//     // Xóa file vật lý: chỉ ảnh FE cũ bị remove
//     if (oldQuestion.isNew) {
//       deletedImages.push(
//         ...oldImages
//           .filter(
//             (img: TImage) =>
//               !mergedImages.some((newImg) => newImg.url === img.url) &&
//               !img.fromDB
//           )
//           .map((img: TImage) => getKeyFromPublicUrl(img.url))
//       );
//     }
//   }

//   // 2️⃣ Add new questions (FE mới)
//   this.snapshotQuestions.push(...diff.added);

//   // 3️⃣ Delete questions
//   const deletedQuestions = diff.deleted;
//   this.snapshotQuestions = this.snapshotQuestions.filter(
//     (sq: SnapshotQuestion) => !deletedQuestions.some((d) => d.id === sq.id)
//   );

//   // Xóa file vật lý của ảnh FE trong câu mới bị deleted
//   deletedImages.push(
//     ...deletedQuestions
//       .filter((q) => q.isNew)
//       .flatMap(
//         (q) =>
//           q.images
//             ?.filter((img) => !img.fromDB)
//             .map((img) => getKeyFromPublicUrl(img.url)) || []
//       )
//   );

//   // 3️⃣ Remove questions
//   this.questionIds = this.questionIds.filter(
//     (id: mongoose.Types.ObjectId) =>
//       !deletedQuestions.some((q) => q.id === id.toString())
//   );

//   console.log("File deleted: ", deletedImages.length);

//   // 4️⃣ Remove files + save quiz
//   await Promise.all([removeFiles(deletedImages), this.save()]);
// };

const QuizModel = mongoose.model<IQuiz>("Quiz", QuizSchema, "quizzes");

export default QuizModel;

//Chạy mỗi phút kiểm tra quiz đã hết thời gian

// cron.schedule("0 */5 * * * *", async () => {
//   console.log("🚀 Running daily quiz cleanup task...");
//   const quizzes = await QuizModel.updateMany(
//     { endTime: { $lt: new Date() }, isCompleted: false },
//     { isCompleted: true }
//   );

//   if (quizzes.modifiedCount > 0) {
//     console.log(`✅ Updated ${quizzes.modifiedCount} completed quizzes.`);
//   }
// });
