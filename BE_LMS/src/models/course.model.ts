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
    slug: { type: String, required: true, unique: true },
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
// ✅ FIX: Removed unique constraint - one subject can have multiple courses
CourseSchema.index({ semesterId: 1, subjectId: 1 }, { unique: true });
CourseSchema.index({ isPublished: 1, createdAt: -1 });
CourseSchema.index({ teacherIds: 1, isPublished: 1, createdAt: -1 });
CourseSchema.index({ slug: 1 }, { unique: true });
CourseSchema.index({ isPublished: 1, title: 'text', description: 'text' });
// Soft delete indexes
CourseSchema.index({ isDeleted: 1, createdAt: -1 });
CourseSchema.index({ isDeleted: 1, isPublished: 1, createdAt: -1 });

const CourseModel = mongoose.model<ICourse>('Course', CourseSchema, 'courses');

export default CourseModel;
