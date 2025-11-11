import { IFeedback } from "@/types";
import { FeedbackType } from "@/types/feedback.type";
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema<IFeedback>(
  {
    type: {
      type: String,
      enum: FeedbackType,
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    rating: { type: Number, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId }, // có thể ref tới Teacher, Course …
    originalName: { type: String },
    mimeType: { type: String },
    key: { type: String },
    size: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return v <= 20 * 1024 * 1024;
        },
        message: "File size must be <= 20MB",
      },
    },
  },
  { timestamps: true }
);

//Indexes
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ targetId: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, createdAt: -1 });

const FeedbackModel = mongoose.model<IFeedback>(
  "Feedback",
  feedbackSchema,
  "feedbacks"
);

export default FeedbackModel;
