import crypto from "crypto";
import {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from "@/constants/http";
import { CourseInviteModel, CourseModel, UserModel, EnrollmentModel } from "@/models";
import { Role, EnrollmentStatus, EnrollmentMethod} from "@/types";
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
  const { courseId, expiresInDays, maxUses, invitedEmail } = data;

  //ktra email tồn tại
  const invitedUser = await UserModel.findOne({email: invitedEmail});
  appAssert(invitedUser, NOT_FOUND, "User must register before joining");

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
    invitedEmail,
    maxUses,
    expiresAt,
    isActive: true,
  });
// kiểm tra tạo invite trong db thành công chưa
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

/**
 * Yêu cầu nghiệp vụ:
 * - Student click vào link mời để tham gia khóa học
 * - Hash token từ query string và tìm trong DB
 * - Kiểm tra link còn hợp lệ (chưa hết hạn, chưa vượt giới hạn, đang active)
 * - Kiểm tra student chưa enroll vào khóa học
 * - Tự động tạo enrollment cho student
 * - Tăng usedCount
 *
 * Input: token (từ query string), userId (student đang login)
 * Output: enrollment record
 */

export const joinCourseByInvite = async (token: string, userId: string) => {
  //Hash token bằng SHA256 để tìm trong DB
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  // Tìm invite trong DB
  const invite = await CourseInviteModel.findOne({tokenHash}).populate(
    "courseId",
    "title"
  )

  //ktra tồn tại

  appAssert(invite, NOT_FOUND, "Invalid or expired invite link");

  //ktra active === true
  appAssert(invite.isActive, BAD_REQUEST, "This invite link is no longer active");

  //ktra hết hạn
  appAssert(invite.expiresAt > new Date(), BAD_REQUEST, "This invite link has expired");

  //ktra số lần dùng 
  if (invite.maxUses !== null){
    appAssert(
      invite.usedCount < invite.maxUses,
      BAD_REQUEST,
      "This invite link has reached its maximum number of uses"
    )
  }

  //ktra user tồn tại, check role student
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");
  appAssert(user.role === Role.STUDENT, BAD_REQUEST, "Only students can join courses via invite links");
 
  //Ràng buộc email được gửi đến và email đăng nhập phải trùng nhau
  appAssert(invite.invitedEmail === user.email,
    FORBIDDEN,
    `Invite was sent to ${invite.invitedEmail}, please use that email to join the course`
  )
  //ktra student đã enroll chưa
  const existingEnrollment = await EnrollmentModel.findOne({
    courseId: invite.courseId._id,
    studentId: userId,
  });
  if (existingEnrollment) {
    return {
      message: `You are already enrolled in the course "${(invite.courseId as any).title}".`,
      enrollment: existingEnrollment,
      alreadyEnrolled: true,
    };
  }

  //tạo enrollment mới

  const enrollment = await EnrollmentModel.create({
    courseId: invite.courseId._id,
    studentId: userId,
    status: EnrollmentStatus.APPROVED,
    method: EnrollmentMethod.INVITED,
    enrolledAt: new Date(),
  });

  appAssert(enrollment, INTERNAL_SERVER_ERROR, "Failed to enroll in course");

  //Tăng counter: usedCount += 1 để track số lần dùng
  invite.usedCount += 1;
  await invite.save();

  return{
    message: `Successfully joined the course "${(invite.courseId as any).title}".`,
    enrollment,
    alreadyEnrolled: false,
    invitedEmail: invite.invitedEmail,
  }

}




