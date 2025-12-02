import mongoose from 'mongoose';

export default interface IBlog extends mongoose.Document {
  title: string;
  slug?: string;
  content: string;
  thumbnailUrl: string;
  authorName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}
