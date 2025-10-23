import mongoose from "mongoose";

export default interface IForumReply extends mongoose.Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  parentReply?: mongoose.Types.ObjectId;
  createdAt?: Date;
}
