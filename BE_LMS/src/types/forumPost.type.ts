import mongoose from "mongoose";

export default interface IForumPost extends mongoose.Document {
    forumId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    title?: string;
    content: string;
    pinned?: boolean;
    replyCount?: number;
    /** Key for attachments */
    key?: string | string[];
    createdAt?: Date;
    updatedAt?: Date;
}
