import mongoose from "mongoose";
import { thirtyDaysFromNow } from "../utils/date";
import { ISession } from "../types";

const sessionSchema = new mongoose.Schema<ISession>({
  userId: mongoose.Schema.Types.ObjectId,
  userAgent: String,
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true, default: thirtyDaysFromNow },
});

const SessionModel = mongoose.model<ISession>(
  "Session",
  sessionSchema,
  "sessions"
);

export default SessionModel;
