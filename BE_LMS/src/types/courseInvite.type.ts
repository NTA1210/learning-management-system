import mongoose from "mongoose";

export default interface ICourseInvite
  extends mongoose.Document<mongoose.Types.ObjectId> {
  tokenHash: string; // SHA256 hash của token gốc
  courseId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // Teacher/Admin tạo link
  invitedEmail: string;
  maxUses: number | null; // null = không giới hạn
  usedCount: number;
  expiresAt: Date;
  isActive: boolean; // Có thể disable link mà không cần xóa
  // Soft delete fields
  isDeleted: boolean; // Đánh dấu xóa vĩnh viễn (không thể enable lại)
  deletedAt: Date | null;
  deletedBy: mongoose.Types.ObjectId | null; // User xóa invite
  createdAt: Date;
  updatedAt: Date;
}

