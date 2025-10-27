import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { UserStatus } from "../types";
import { MONGO_URI } from "../constants/env";

// Kết nối tới MongoDB
const connectDB = async () => {
  try {
    const mongoUri = MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in .env file");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Thêm field "status" cho user nếu chưa có
const addUserStatus = async () => {
  try {
    const result = await UserModel.updateMany(
      { status: { $exists: false } }, // chỉ cập nhật user chưa có field status
      { $set: { status: UserStatus.ACTIVE } } // gán giá trị mặc định
    );

    console.log(
      `✅ Added status field to ${result.modifiedCount || 0} user(s).`
    );
  } catch (error) {
    console.error("❌ Error updating users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Chạy script
(async () => {
  await connectDB();
  await addUserStatus();
})();
