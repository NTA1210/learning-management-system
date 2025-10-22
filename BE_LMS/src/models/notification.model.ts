import mongoose from "mongoose";
import { INotification } from "../types";

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipientCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    recipientType: {
      type: String,
      enum: ["user", "course", "all"],
      default: "user",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: "createdAt" } }
);

NotificationSchema.methods.markRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.index({ recipientUser: 1, createdAt: -1 });
export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
