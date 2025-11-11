import crypto from "crypto";
import {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "@/constants/http";
import { CourseInviteModel, CourseModel, UserModel } from "@/models";
import { Role } from "@/types";
import appAssert from "@/utils/appAssert";
import { APP_ORIGIN } from "@/constants/env";
import { TCreateCourseInvite } from "@/validators/courseInvite.schemas";

/**
 * Yêu cầu nghiệp vụ:
 * - Teacher/Admin tạo link mời tham gia khóa học
 * - Dùng crypto.randomBytes để tạo token ngẫu nhiên (64 ký tự hex)
 * - Hash token bằng SHA256 trước khi lưu vào DB (bảo mật)
 * - Link có thời hạn và giới hạn số lần dùng (optional)
 * - Chỉ gửi token gốc qua link, không lưu vào DB
 * - Teacher chỉ tạo được link cho course mình dạy
 * - Admin tạo được link cho bất kỳ course nào
 *
 * Input: courseId, expiresInDays, maxUses, createdBy (userId)
 * Output: inviteLink với token gốc, thông tin invite
 */
export const createCourseInvite = async (
  data: TCreateCourseInvite,
  createdBy: string
) => {
  const { courseId, expiresInDays, maxUses } = data;

  // Kiểm tra khóa học tồn tại
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  // Kiểm tra quyền: chỉ teacher của khóa học hoặc admin mới tạo được link
  const user = await UserModel.findById(createdBy);
  appAssert(user, NOT_FOUND, "User not found");

  if (user.role !== Role.ADMIN) {
    const isTeacherOfCourse = course.teacherIds.some(
      (teacherId) => teacherId.toString() === createdBy
    );
    appAssert(
      isTeacherOfCourse,
      FORBIDDEN,
      "Only course teachers or admin can create invite links"
    );
  }

  // Tạo token ngẫu nhiên 32 bytes = 64 ký tự hex
  const token = crypto.randomBytes(32).toString("hex");

  // Hash token bằng SHA256 để lưu vào DB
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Tính thời gian hết hạn
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  );

  // Tạo invite record
  const invite = await CourseInviteModel.create({
    tokenHash,
    courseId,
    createdBy,
    maxUses,
    expiresAt,
    isActive: true,
  });

  appAssert(invite, INTERNAL_SERVER_ERROR, "Failed to create invite link");

  // Tạo link với token gốc (KHÔNG lưu token gốc vào DB)
  const inviteLink = `${APP_ORIGIN}/courses/join?token=${token}`;

  return {
    invite: {
      _id: invite._id,
      courseId: invite.courseId,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
      expiresAt: invite.expiresAt,
      isActive: invite.isActive,
      createdAt: invite.createdAt,
    },
    inviteLink,
  };
};
