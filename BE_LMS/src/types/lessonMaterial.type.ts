import mongoose from "mongoose";

export default interface ILessonMaterial extends mongoose.Document {
  lessonId: mongoose.Types.ObjectId;
  title?: string;
  note?: string;
  originalName?: string;
  mimeType?: string;
  key: string;
  size: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
