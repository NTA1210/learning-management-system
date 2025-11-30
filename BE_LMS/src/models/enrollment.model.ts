import mongoose from 'mongoose';
import { IEnrollment } from '../types';
import {
  EnrollmentMethod,
  EnrollmentRole,
  EnrollmentStatus,
  IAssignmentDetails,
  IQuizDetails,
} from '../types/enrollment.type';

const quizDetailsSchema = new mongoose.Schema<IQuizDetails>(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String },
    score: { type: Number },
    isCompleted: { type: Boolean },
  },
  {
    _id: false,
  }
);

const assignmentDetailsSchema = new mongoose.Schema<IAssignmentDetails>(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String },
    score: { type: Number },
    isCompleted: { type: Boolean },
  },
  {
    _id: false,
  }
);

const EnrollmentSchema = new mongoose.Schema<IEnrollment>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: EnrollmentStatus,
      default: EnrollmentStatus.PENDING,
    },
    method: {
      type: String,
      enum: EnrollmentMethod,
      default: EnrollmentMethod.SELF,
    },
    role: {
      type: String,
      enum: EnrollmentRole,
      default: EnrollmentRole.STUDENT,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: { type: Date },
    note: { type: String },
    progress: {
      totalLessons: { type: Number, default: 0 },
      completedLessons: { type: Number, default: 0 },
      totalQuizzes: { type: Number, default: 0 },
      completedQuizzes: { type: Number, default: 0 },
      totalQuizScores: { type: Number, default: 0 },
      quizDetails: {
        type: [quizDetailsSchema],
        default: [],
      },
      totalAssignments: { type: Number, default: 0 },
      completedAssignments: { type: Number, default: 0 },
      totalAssignmentScores: { type: Number, default: 0 },
      assignmentDetails: {
        type: [assignmentDetailsSchema],
        default: [],
      },
      totalAttendances: { type: Number, default: 0 },
      completedAttendances: { type: Number, default: 0 },
    },
    finalGrade: { type: Number },
    completedAt: { type: Date },
    droppedAt: { type: Date },
  },
  { timestamps: true }
);

//indexes
// One student can only enroll in one class per course (not multiple classes of same course)
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, courseId: 1, status: 1 });
EnrollmentSchema.index({ studentId: 1, status: 1 });

const EnrollmentModel = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema, 'enrollments');

export default EnrollmentModel;
