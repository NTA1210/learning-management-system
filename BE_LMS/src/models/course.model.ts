import mongoose from "mongoose";
import { ICourse } from "../types";

const CourseSchema = new mongoose.Schema<ICourse>(
  {
    title: { type: String, required: true, index: true },
    code: { type: String, index: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublished: { type: Boolean, default: false },
    capacity: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

CourseSchema.index({ title: "text", description: "text" });
export default mongoose.model<ICourse>("Course", CourseSchema);
