import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import { Role, UserStatus } from "@/types";
import appAssert from "@/utils/appAssert";
import { TGetAllUsersFilter } from "@/validators/user.schemas";

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
      .skip(skip)
      .limit(limit)
      .select("-password -__v")
      .lean(),
    UserModel.countDocuments(query),
  ]);

  // Kiểm tra và đánh dấu người dùng đã đăng ký khóa học (nếu viewer là student)

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: users.map((user) => formatUserResponse(user, viewerRole)),
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
function formatUserResponse(user: any, viewerRole: Role) {
  const base = {
    _id: user._id,
    fullname: user.fullname,
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
    const { password, __v, ...rest } = user;
    return rest;
  }

  return base;
}
