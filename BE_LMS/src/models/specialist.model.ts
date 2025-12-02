import ISpecialist from '../types/specialist.type';
import mongoose from 'mongoose';

const SpecialistSchema = new mongoose.Schema<ISpecialist>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    slug: { type: String, trim: true },
    majorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Major' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

//indexes
SpecialistSchema.index({ name: 1 }, { unique: true });
SpecialistSchema.index({ name: 'text' });
SpecialistSchema.index({ slug: 1 }, { unique: true });
SpecialistSchema.index({ slug: 'text' });
SpecialistSchema.index({ majorId: 1, isActive: 1 });

//hooks
SpecialistSchema.pre('save', function (next) {
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

const SpecialistModel = mongoose.model<ISpecialist>('Specialist', SpecialistSchema, 'specialists');

export default SpecialistModel;
