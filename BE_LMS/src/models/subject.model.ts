import { ISubject } from '../types';
import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    code: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    specialistIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Specialist' }],
    credits: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes tối ưu
SubjectSchema.index({ name: 1 }, { unique: true });
SubjectSchema.index({ slug: 1 }, { unique: true });
SubjectSchema.index({ code: 1 }, { unique: true });
SubjectSchema.index({ specialistIds: 1 });

// ✅ Text index (nếu có tính năng search) + weights ưu tiên name > code > description
SubjectSchema.index(
  { name: 'text', description: 'text', code: 'text' },
  { weights: { name: 10, code: 6, description: 2 } }
);

// ✅ Hook: Tạo slug tự động
SubjectSchema.pre('save', function (next) {
  this.slug = this.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace nhiều space bằng dấu -
    .replace(/[^\w-]+/g, ''); // remove ký tự đặc biệt
  next();
});

const SubjectModel = mongoose.model<ISubject>('Subject', SubjectSchema);
export default SubjectModel;
