import mongoose from "mongoose";
import { thirtyDaysFromNow } from "../utils/date";

export interface SessionDocument
  extends mongoose.Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new mongoose.Schema<SessionDocument>({
  userId: mongoose.Schema.Types.ObjectId,
  userAgent: String,
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, default: thirtyDaysFromNow },
});

const SessionModel = mongoose.model<SessionDocument>(
  "Session",
  sessionSchema,
  "sessions"
);

export default SessionModel;
