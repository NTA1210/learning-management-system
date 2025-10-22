import mongoose from "mongoose";
import VerificationCodeType from "../constants/verificationCode";

export default interface IVerificationCode extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: VerificationCodeType;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}
