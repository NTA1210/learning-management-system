import mongoose from "mongoose";

export interface IForum extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const ForumSchema = new mongoose.Schema<IForum>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IForum>("Forum", ForumSchema);
