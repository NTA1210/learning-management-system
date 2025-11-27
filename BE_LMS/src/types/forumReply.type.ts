import mongoose from "mongoose";

export default interface IForumReply extends mongoose.Document {
    postId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    content: string;
    parentReplyId?: mongoose.Types.ObjectId;
    /** Key for attachments */
    key?: string | string[];
    createdAt?: Date;
    updatedAt?: Date;
}
