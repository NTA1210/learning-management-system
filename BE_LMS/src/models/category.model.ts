import mongoose from "mongoose";

export interface ICategory extends mongoose.Document {
  name: string;
  slug?: string;
  description?: string;
}

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>("Category", CategorySchema);
