import mongoose from "mongoose";

export default interface ICourseInvite
  extends mongoose.Document<mongoose.Types.ObjectId> {
  tokenHash: string; // SHA256 hash của token gốc
  courseId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // Teacher/Admin tạo link
  maxUses: number | null; // null = không giới hạn
  usedCount: number;
  expiresAt: Date;
  isActive: boolean; // Có thể disable link mà không cần xóa
  createdAt: Date;
  updatedAt: Date;
}

