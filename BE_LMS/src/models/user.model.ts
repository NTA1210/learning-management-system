import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

const enum Role {
  USER = "user",
  ADMIN = "admin",
}

export interface UserDocument
  extends mongoose.Document<mongoose.Types.ObjectId> {
  email: string;
  password: string;
  role: Role;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Omit<UserDocument, "password">;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: Role.USER },
    verified: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

// Middleware "pre-save" trong Mongoose:
// Hàm này sẽ tự động chạy TRƯỚC KHI document được lưu (save) vào MongoDB
userSchema.pre("save", async function (next) {
  // ✅ Kiểm tra xem field "password" có bị thay đổi không
  // Nếu KHÔNG thay đổi (ví dụ chỉ update email, name,...) thì bỏ qua việc hash lại
  if (!this.isModified("password")) next();

  // ✅ Nếu password đã thay đổi hoặc là lần đầu tạo user,
  // thì hash lại password trước khi lưu vào database
  this.password = await hashValue(this.password);

  // ✅ Gọi next() để cho phép Mongoose tiếp tục quá trình lưu document
  next();
});

userSchema.methods.comparePassword = async function (value: string) {
  return await compareValue(value, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
