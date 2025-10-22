import mongoose from "mongoose";
import { ILessonMaterial } from "../types";

const LessonMaterialSchema = new mongoose.Schema<ILessonMaterial>(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    title: { type: String },
    type: {
      type: String,
      enum: ["pdf", "video", "ppt", "link", "other"],
      default: "other",
    },
    fileUrl: { type: String },
    fileName: { type: String },
    sizeBytes: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false } }
);

export default mongoose.model<ILessonMaterial>(
  "LessonMaterial",
  LessonMaterialSchema
);
