import mongoose from "mongoose";

export default interface ICategory extends mongoose.Document {
  name: string;
  slug?: string;
  description?: string;
}
