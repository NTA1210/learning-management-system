import mongoose from "mongoose";

export interface IAssignment extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  maxScore?: number;
  dueDate?: Date;
  allowLate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AssignmentSchema = new mongoose.Schema<IAssignment>(
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
    maxScore: { type: Number, default: 100 },
    dueDate: { type: Date },
    allowLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AssignmentSchema.index({ courseId: 1 });
export default mongoose.model<IAssignment>("Assignment", AssignmentSchema);
