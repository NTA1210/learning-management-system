import mongoose from "mongoose";
import { IForumPost } from "../types";

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
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

//Indexes
ForumPostSchema.index({ forumId: 1, pinned: -1, createdAt: -1 });
ForumPostSchema.index({ authorId: 1, createdAt: -1 });

const ForumPostModel = mongoose.model<IForumPost>(
  "ForumPost",
  ForumPostSchema,
  "forumPosts"
);

export default ForumPostModel;
