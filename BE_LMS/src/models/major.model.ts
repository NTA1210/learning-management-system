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

const MajorModel = mongoose.model<IMajor>('Major', MajorSchema, 'majors');

export default MajorModel;
