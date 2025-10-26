import mongoose from "mongoose";
import Enrollment from "../models/enrollment.model"; // đảm bảo đường dẫn đúng
import { MONGO_URI } from "../constants/env";

async function modifyEnrollment() {
  try {
    // 1️⃣ Kết nối MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("enrollments");

    // 2️⃣ Xoá index cũ nếu tồn tại
    const indexes = await collection.indexes();
    const oldIndex = indexes.find(
      (idx) => idx.name === "studentId_1_courseId_1"
    );

    if (oldIndex) {
      await collection.dropIndex("studentId_1_courseId_1");
      console.log("🗑️ Dropped old index: studentId_1_courseId_1");
    } else {
      console.log("ℹ️ No old index found to drop");
    }

    // 3️⃣ Cập nhật đổi studentId → userId
    const result = await Enrollment.updateMany(
      { studentId: { $exists: true } },
      [{ $set: { userId: "$studentId" } }, { $unset: "studentId" }]
    );

    console.log(`✅ Modified ${result.modifiedCount || 0} documents`);

    // 4️⃣ Tạo lại index mới
    await collection.createIndex({ userId: 1, courseId: 1 }, { unique: true });
    console.log("🔁 Created new index: userId_1_courseId_1 (unique)");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

modifyEnrollment();
