import mongoose from "mongoose";

export default interface ILessonMaterial extends mongoose.Document {
  lessonId: mongoose.Types.ObjectId;
  title?: string;
  type: "pdf" | "video" | "ppt" | "link" | "other";
  fileUrl?: string;
  fileName?: string;
  sizeBytes?: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
}
