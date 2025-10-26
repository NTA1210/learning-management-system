import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";
import { Role, IUser, UserStatus } from "../types";

const userSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, unique: true, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: Role.STUDENT },
    fullname: { type: String },
    phone_number: { type: String },
    avatar_url: { type: String },
    bio: { type: String },
    verified: { type: Boolean, required: true, default: false },
    status: { type: String, required: true, default: UserStatus.ACTIVE },
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
  if (!this.isModified("password")) return next();

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

userSchema.methods.response = function (viewerRole: Role = Role.STUDENT) {
  const baseData = {
    fullname: this.fullname,
    avatar_url: this.avatar_url,
    bio: this.bio,
    role: this.role,
  };

  if (viewerRole === Role.TEACHER) {
    return {
      ...baseData,
      email: this.email,
      phone_number: this.phone_number,
    };
  }

  if (viewerRole === Role.ADMIN) {
    return {
      ...this.toObject(),
      password: undefined,
    };
  }

  // public
  return baseData;
};

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
