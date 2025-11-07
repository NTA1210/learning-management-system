import mongoose from "mongoose";

export default interface IForum extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  forumType: ForumType;
  isActive?: boolean;
  isArchived?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ForumType {
    /** Open forum, everyone can post and reply to each other */
    DISCUSSION = "discussion",
    /** Read-only forum, only teacher can post */
    ANNOUNCEMENT = "announcement",
}
