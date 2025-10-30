import mongoose from "mongoose";

export default interface ISpecialist
  extends mongoose.Document<mongoose.Types.ObjectId> {
  name: string;
  description?: string;
  slug?: string;
  majorId: mongoose.Types.ObjectId;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
