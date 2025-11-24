import mongoose from "mongoose";

export const normalizeObjectId = (
  id?: mongoose.Types.ObjectId | string | null
) => {
  if (!id) return "";
  return typeof id === "string" ? id : id.toString();
};

