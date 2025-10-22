import mongoose from "mongoose";

export default interface ISession
  extends mongoose.Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}
