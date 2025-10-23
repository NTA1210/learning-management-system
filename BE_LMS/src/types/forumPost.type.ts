import mongoose from "mongoose";

export default interface IForumPost extends mongoose.Document {
  forumId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  pinned?: boolean;
}
