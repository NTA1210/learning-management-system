import mongoose from "mongoose";

export interface IAnnouncement extends mongoose.Document {
  title: string;
  content: string;
  courseId?: mongoose.Types.ObjectId; // if null, system-wide
  authorId?: mongoose.Types.ObjectId;
  publishedAt?: Date;
}

const AnnouncementSchema = new mongoose.Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema
);
