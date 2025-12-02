import mongoose from 'mongoose';
import { IQuiz, SnapshotQuestion } from '../types';
import cron from 'node-cron';
import { QuizQuestionType } from '@/types/quizQuestion.type';
import crypto from 'crypto';

export type TImage = {
  url: string;
  fromDB: boolean;
};

export const ImageSchema = {
  url: { type: String, required: true },
  fromDB: { type: Boolean, default: false },
};

const SnapshotQuestionSchema = new mongoose.Schema<SnapshotQuestion>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: QuizQuestionType, required: true },
    options: { type: [String], required: true },
    correctOptions: { type: [Number], required: true },
    images: { type: [ImageSchema], default: [] },
    points: { type: Number, default: 1 },
    explanation: { type: String, trim: true },
    isExternal: { type: Boolean, default: true },
    isNewQuestion: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isDirty: { type: Boolean, default: false },
  },
  { _id: false } // tắt _id riêng cho sub-doc
);

const QuizSchema = new mongoose.Schema<IQuiz>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    shuffleQuestions: { type: Boolean, default: false },
    hashPassword: { type: String },
    snapshotQuestions: {
      type: [SnapshotQuestionSchema],
      default: [],
    },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

//Indexes
QuizSchema.index({ courseId: 1, isPublished: 1, createdAt: -1 });
QuizSchema.index({ courseId: 1, title: 1 });

//Methods

QuizSchema.methods.generateHashPassword = function (length: number = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  // Bỏ ký tự dễ nhầm: 0 O I l 1

  const bytes = crypto.randomBytes(length);
  let pass = '';

  for (let i = 0; i < length; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
};

QuizSchema.methods.compareHashPassword = function (pass: string) {
  return this.hashPassword === pass;
};

//hooks

QuizSchema.pre('save', function (next) {
  if (!this.hashPassword) {
    this.hashPassword = this.generateHashPassword();
  }
  next();
});

const QuizModel = mongoose.model<IQuiz>('Quiz', QuizSchema, 'quizzes');

export default QuizModel;
