import mongoose from "mongoose";

export default interface IMajor
  extends mongoose.Document<mongoose.Types.ObjectId> {
  name: string;
  slug?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
