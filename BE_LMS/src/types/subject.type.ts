import mongoose from "mongoose";

export default interface ISubject
  extends mongoose.Document<mongoose.Types.ObjectId> {
  name: string;
  description?: string;
  code: string;
  slug: string;
  specialistIds: mongoose.Types.ObjectId[];
  credits: number;
  isActive?: boolean;
  prerequisites?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
