import IMajor from '../types/major.type';
import mongoose from 'mongoose';

const MajorSchema = new mongoose.Schema<IMajor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

//indexes
MajorSchema.index({ name: 1 }, { unique: true });
MajorSchema.index({ name: 'text' });
MajorSchema.index({ slug: 1 }, { unique: true });
MajorSchema.index({ slug: 'text' });

//hooks
MajorSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace nhiều space bằng dấu -
    .replace(/[^\w-]+/g, ''); // remove ký tự đặc biệt
  next();
});

const MajorModel = mongoose.model<IMajor>('Major', MajorSchema, 'majors');

export default MajorModel;
