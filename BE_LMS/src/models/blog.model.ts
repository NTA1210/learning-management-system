import IBlog from '@/types/blog.type';
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
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace nhiều space bằng dấu -
    .replace(/[^\w-]+/g, ''); // remove ký tự đặc biệt
  next();
});

const BlogModel = mongoose.model<IBlog>('Blog', BlogSchema, 'blogs');
export default BlogModel;
