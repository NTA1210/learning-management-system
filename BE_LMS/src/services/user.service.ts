import { NOT_FOUND } from "@/constants/http";
import { SpecialistModel } from "@/models";
import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import { ISpecialist, IUser, Role, UserStatus } from "@/types";
import appAssert from "@/utils/appAssert";
import { prefixUserAvatar } from "@/utils/filePrefix";
import { removeFile, uploadFile } from "@/utils/uploadFile";
import {
  TGetAllUsersFilter,
  TUpdateUserProfile,
} from "@/validators/user.schemas";

export const getAllUsers = async (
  request: TGetAllUsersFilter,
  viewerRole: Role
) => {
  const { role, email, username, status, page = 1, limit = 10 } = request;

  // 3️⃣ Pagination
  const skip = (page - 1) * limit;

  const query: any = {};

  if (viewerRole === Role.ADMIN) {
    if (role) query.role = role; // admin có thể lọc role cụ thể
    if (status) query.status = status; // admin có thể lọc status cụ thể
  } else {
    if (viewerRole === Role.TEACHER) {
      query.role = Role.STUDENT; // teacher chỉ được xem student
    }
    if (viewerRole === Role.STUDENT) {
      query.role = Role.TEACHER;
    }
    query.status = UserStatus.ACTIVE; // không phải admin chỉ xem user active
  }

  if (email) query.email = { $regex: email, $options: "i" };
  if (username) query.username = { $regex: username, $options: "i" };

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .populate("specialistIds")
      .skip(skip)
      .limit(limit)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .lean<IUser[]>(),
    UserModel.countDocuments(query),
  ]);

  // Kiểm tra và đánh dấu người dùng đã đăng ký khóa học (nếu viewer là student)

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: users.map((user: IUser) => formatUserResponse(user, viewerRole)),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};
function formatUserResponse(user: IUser, viewerRole: Role) {
  const base = {
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    avatar_url: user.avatar_url,
    bio: user.bio,
    role: user.role,
  };

  if (viewerRole === Role.TEACHER) {
    return {
      ...base,
      email: user.email,
      phone_number: user.phone_number,
    };
  }

  if (viewerRole === Role.ADMIN) {
    const { password, ...rest } = user;
    return rest;
  }

  return base;
}

export const updateUserProfile = async (
  { userId, ...data }: TUpdateUserProfile,
  userRole: Role
) => {
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  const {
    username,
    email,
    fullname,
    phone_number,
    avatar,
    bio,
    status,
    isVerified,
    specialistIds,
  } = data;

  if (username) {
    const usernameExists = await UserModel.exists({ username });
    appAssert(!usernameExists, NOT_FOUND, "Username already in use");
    user.username = username;
  }

  if (email) {
    const emailExists = await UserModel.exists({ email });
    appAssert(!emailExists, NOT_FOUND, "Email already in use");
    user.email = email;
  }

  if (fullname) user.fullname = fullname;
  if (phone_number) user.phone_number = phone_number;
  if (bio) user.bio = bio;
  if (avatar) {
    const prefix = prefixUserAvatar(userId);
    const { publicUrl, key } = await uploadFile(avatar, prefix);
    if (user.key) {
      await removeFile(user.key);
    }
    user.avatar_url = publicUrl;
    user.key = key;
  }

  if (userRole === Role.ADMIN) {
    if (status) user.status = status;
    if (isVerified) user.isVerified = isVerified;
    if (specialistIds?.length) {
      const specialists = await SpecialistModel.find({
        _id: { $in: specialistIds },
      });
      appAssert(
        specialists.length === specialistIds.length,
        NOT_FOUND,
        "Specialist not found"
      );
      user.specialistIds = specialists.map((spec: ISpecialist) => spec._id);
    }
  }

  await user.save();
  return formatUserResponse(user.toObject(), userRole);
};
