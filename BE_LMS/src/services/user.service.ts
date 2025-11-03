import { NOT_FOUND } from "@/constants/http";
import courseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import { Role, UserStatus } from "@/types";
import appAssert from "@/utils/appAssert";
import { TGetAllUsersFilter } from "@/validators/user.schemas";

export const getAllUsers = async (
  courseId: string,
  request: TGetAllUsersFilter,
  viewerRole: Role
) => {
  const course = await courseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  const { role, email, username, page = 1, limit = 10 } = request;

  // 3️⃣ Pagination
  const skip = (page - 1) * limit;

  const query: any = {};

  if (viewerRole === Role.ADMIN) {
    if (role) query.role = role; // admin có thể lọc role cụ thể
  } else {
    if (role && role !== Role.ADMIN) {
      query.role = role;
    } else {
      query.role = { $ne: Role.ADMIN };
    }
  }

  if (email) query.email = { $regex: email, $options: "i" };
  if (username) query.username = { $regex: username, $options: "i" };

  const [users, enrolledList] = await Promise.all([
    UserModel.find({
      ...query,
      verified: true,
      status: UserStatus.ACTIVE,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EnrollmentModel.find({ courseId, status: "active" }).select("userId"),
  ]);

  const enrolledUerIds = new Set<String>(
    enrolledList.map((enrollment) => enrollment.studentId.toString())
  );

  const usersWithEnrolledStatus = users.map((user) => {
    const isEnrolled = enrolledUerIds.has(user._id.toString());
    return {
      ...user,
      isEnrolled,
    };
  });

  const formattedUsers = usersWithEnrolledStatus.map((u) =>
    formatUserResponse(u, viewerRole)
  );

  const total = await UserModel.countDocuments({
    ...query,
    status: UserStatus.ACTIVE,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    users: formattedUsers,
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
    isEnrolled: user.isEnrolled ?? false,
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
