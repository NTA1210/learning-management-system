import mongoose from 'mongoose';
import { IVerificationCode } from '../types';

const verificationSchema = new mongoose.Schema<IVerificationCode>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'User',
  },
  type: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const VerificationCodeModel = mongoose.model<IVerificationCode>(
  'VerificationCode',
  verificationSchema,
  'verification_codes'
);

export default VerificationCodeModel;
