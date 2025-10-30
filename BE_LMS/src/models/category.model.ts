import mongoose from "mongoose";
import { ICategory } from "../types";

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);

export default CategoryModel;
