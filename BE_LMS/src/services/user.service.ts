import { NOT_FOUND } from "@/constants/http";
import courseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import { Role, UserStatus } from "@/types";
import appAssert from "@/utils/appAssert";
import { formatUserResponse } from "@/utils/userResponse";
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
  if (role) query.role = role;
  if (email) query.email = { $regex: email, $options: "i" };
  if (username) query.username = { $regex: username, $options: "i" };

  const [users, enrolledList] = await Promise.all([
    UserModel.find({ ...query, verified: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EnrollmentModel.find({ courseId, status: "active" }).select("userId"),
  ]);

  const enrolledUerIds = new Set<String>(
    enrolledList.map((enrollment) => enrollment.userId.toString())
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
