import mongoose from "mongoose";

export const enum Role {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export const enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export default interface IUser
  extends mongoose.Document<mongoose.Types.ObjectId> {
  username?: string;
  email: string;
  password: string;
  role: Role;
  fullname?: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  status?: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Omit<IUser, "password">;
  response(): IUser;
}
