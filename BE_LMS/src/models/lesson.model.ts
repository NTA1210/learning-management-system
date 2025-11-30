import mongoose from 'mongoose';
import { ILesson } from '../types';

const LessonSchema = new mongoose.Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    content: { type: String, maxLength: 100000, trim: true },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes for better performance
LessonSchema.index({ courseId: 1, order: 1 }, { unique: true });
LessonSchema.index({ title: 'text', content: 'text' });
LessonSchema.index({ courseId: 1, title: 1 });
LessonSchema.index({ courseId: 1, isPublished: 1, createdAt: -1 });
LessonSchema.index({ publishedAt: 1 });

// Hooks
LessonSchema.pre('save', async function (next) {
  if (!this.order) {
    const count = await mongoose.model('Lesson').countDocuments({ courseId: this.courseId });
    this.order = count + 1;
  }
  next();
});

const LessonModel = mongoose.model<ILesson>('Lesson', LessonSchema, 'lessons');

export default LessonModel;
