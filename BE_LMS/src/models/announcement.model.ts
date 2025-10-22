import mongoose from "mongoose";
import { IAnnouncement } from "../types";

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
