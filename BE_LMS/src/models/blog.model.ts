import { IBlog } from '@/types';
import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String },
    content: { type: String, required: true },
    thumbnailUrl: { type: String },
    authorName: { type: String, required: true },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

//indexes
BlogSchema.index({ title: 1 }, { unique: true });
BlogSchema.index({ title: 'text', content: 'text' });
BlogSchema.index({ slug: 1 }, { unique: true });

//hooks
BlogSchema.pre('save', function (next) {
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

const BlogModel = mongoose.model<IBlog>('Blog', BlogSchema, 'blogs');
export default BlogModel;
