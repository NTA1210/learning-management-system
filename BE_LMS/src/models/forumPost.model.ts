import mongoose from "mongoose";

export interface IForumPost extends mongoose.Document {
  forumId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
  pinned?: boolean;
}

const ForumPostSchema = new mongoose.Schema<IForumPost>(
  {
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IForumPost>("ForumPost", ForumPostSchema);
