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

//Indexes
AnnouncementSchema.index({ courseId: 1, publishedAt: -1 });
AnnouncementSchema.index({ publishedAt: -1 });
AnnouncementSchema.index({ title: "text", content: "text" });

const AnnouncementModel = mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema,
  "announcements"
);

export default AnnouncementModel;
