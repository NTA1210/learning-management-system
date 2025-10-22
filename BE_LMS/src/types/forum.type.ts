import mongoose from "mongoose";

export default interface IForum extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
}
