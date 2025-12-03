import mongoose from 'mongoose';
import { ICourse } from '../types';
import { CourseStatus } from '../types/course.type';

const CourseSchema = new mongoose.Schema<ICourse>(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    // ✅ UNIVERSITY RULE: Course MUST belong to a Subject
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    logo: { type: String },
    key: { type: String }, // MinIO key for logo file (used for deletion)
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date) {
          return value > this.startDate;
        },
        message: 'EndDate must be greater than StartDate',
      },
    },
    // NEW — dùng để thống kê
    statistics: {
      totalStudents: { type: Number, default: 0 },
      totalLessons: { type: Number, default: 0 },
      totalQuizzes: { type: Number, default: 0 },
      quizDetails: [
        {
          quizId: mongoose.Types.ObjectId,
          title: String,
          score: Number,
          isCompleted: Boolean,
        },
      ],
      averageQuizScore: { type: Number, default: 0 },
      totalAssignments: { type: Number, default: 0 },
      completedAssignments: { type: Number, default: 0 },
      averageAssignmentScore: { type: Number, default: 0 },
      averageFinalGrade: { type: Number, default: 0 },
      totalAttendances: { type: Number, default: 0 },
      averageAttendance: { type: Number, default: 0 },
      passRate: { type: Number, default: 0 },
      droppedRate: { type: Number, default: 0 },
    },
    //
    // optional: weight for scoring
    weight: {
      quiz: { type: Number, default: 0.3 },
      assignment: { type: Number, default: 0.5 },
      attendance: { type: Number, default: 0.2 },
    },
    //
    status: {
      type: String,
      required: true,
      enum: CourseStatus,
      default: CourseStatus.DRAFT,
    },
    teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublished: { type: Boolean, default: false },
    capacity: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },
    enrollRequiresApproval: { type: Boolean, default: false },
    enrollPasswordHash: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Soft delete fields
    // TODO: Check for isDeleted usage in services and controllers, then delete this field
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

//indexes
// ✅ UPDATED: Removed unique constraint to allow multiple courses per subject per semester
// This enables creating multiple class sections (e.g., Math 101 - Section A, Math 101 - Section B)
CourseSchema.index({ semesterId: 1, subjectId: 1 });
CourseSchema.index({ isPublished: 1, createdAt: -1 });
CourseSchema.index({ teacherIds: 1, isPublished: 1, createdAt: -1 });
CourseSchema.index({ slug: 1 }, { unique: true });
CourseSchema.index({ isPublished: 1, title: 'text', description: 'text' });
// Soft delete indexes
CourseSchema.index({ isDeleted: 1, createdAt: -1 });
CourseSchema.index({ isDeleted: 1, isPublished: 1, createdAt: -1 });

//hooks
CourseSchema.pre('save', function (next) {
  this.slug = this.title
    .normalize('NFD') // tách ký tự và dấu
    .replace(/[\u0300-\u036f]/g, '') // remove dấu
    .replace(/đ/g, 'd') // chuyển đ
    .replace(/Đ/g, 'd') // chuyển Đ
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
  next();
});

const CourseModel = mongoose.model<ICourse>('Course', CourseSchema, 'courses');

export default CourseModel;
