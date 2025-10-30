import mongoose from "mongoose";
import { IForumReply } from "../types";

const ForumReplySchema = new mongoose.Schema<IForumReply>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" },
  },
  { timestamps: true }
);

//Indexes
ForumReplySchema.index({ postId: 1, createdAt: 1 });
ForumReplySchema.index({ parentReplyId: 1, createdAt: 1 });
ForumReplySchema.index({ authorId: 1, createdAt: -1 });

const ForumReplyModel = mongoose.model<IForumReply>(
  "ForumReply",
  ForumReplySchema,
  "forumReplies"
);

export default ForumReplyModel;
