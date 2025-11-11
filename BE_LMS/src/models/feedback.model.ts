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
    content: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId }, // có thể ref tới Teacher, Course …
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
