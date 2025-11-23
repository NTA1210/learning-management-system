import { NotificationRecipientType } from './../types/notification.type';
import mongoose from 'mongoose';
import { INotification } from '../types';

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    recipientType: {
      type: String,
      enum: NotificationRecipientType,
      default: 'user',
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    // Soft delete flags
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

NotificationSchema.methods.markRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Existing index
NotificationSchema.index({ recipientUser: 1, createdAt: -1 });
// Index supporting inbox listing & unread counting while considering soft delete
NotificationSchema.index({
  recipientUser: 1,
  isDeleted: 1,
  isRead: 1,
  createdAt: -1,
});
const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;
