import { ISubject } from "@/types";
import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema<ISubject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    code: { type: String, required: true },
    slug: { type: String, required: true },
    specialistIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Specialist" },
    ],
    credits: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes tối ưu
SubjectSchema.index({ name: 1 }, { unique: true });
SubjectSchema.index({ slug: 1 }, { unique: true });
SubjectSchema.index({ specialistIds: 1 });

// ✅ Text index (nếu có tính năng search)
SubjectSchema.index({ name: "text", description: "text" });

// ✅ Hook: Tạo slug tự động
SubjectSchema.pre("save", function (next) {
  this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  next();
});

const SubjectModel = mongoose.model<ISubject>("Subject", SubjectSchema);
export default SubjectModel;
