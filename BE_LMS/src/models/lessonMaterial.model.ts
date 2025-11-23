import mongoose from 'mongoose';
import { ILessonMaterial } from '../types';

const LessonMaterialSchema = new mongoose.Schema<ILessonMaterial>(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    title: { type: String, trim: true },
    note: { type: String, trim: true },
    originalName: { type: String },
    mimeType: { type: String },
    key: { type: String }, // courses/courseId/lessonId/fileName
    size: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return v <= 20 * 1024 * 1024;
        },
        message: 'File size must be <= 20MB',
      },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

//Indexes
LessonMaterialSchema.index({ lessonId: 1, type: 1 });
LessonMaterialSchema.index({ uploadedBy: 1, uploadedAt: -1 });
LessonMaterialSchema.index({ key: 1 }, { unique: true });

const LessonMaterialModel = mongoose.model<ILessonMaterial>(
  'LessonMaterial',
  LessonMaterialSchema,
  'lessonMaterials'
);

export default LessonMaterialModel;
