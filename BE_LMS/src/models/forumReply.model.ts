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
    parentReply: { type: mongoose.Schema.Types.ObjectId, ref: "ForumReply" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IForumReply>("ForumReply", ForumReplySchema);
