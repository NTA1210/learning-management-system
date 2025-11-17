import crypto from "crypto";
import mongoose from "mongoose";
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
import { TCreateCourseInvite, TListCourseInvite, TUpdateCourseInvite, TCourseInviteId } from "@/validators/courseInvite.schemas";
import ICourseInvite from "@/types/courseInvite.type";
import { FilterQuery } from "mongoose";

/**
 * Yêu cầu nghiệp vụ:
 * - Teacher/Admin tạo link mời tham gia khóa học
 * - Cho phép invite cả email chưa đăng ký (student sẽ đăng ký/đăng nhập sau khi nhận link)
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
  const { courseId, expiresInDays, maxUses, invitedEmails } = data;

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
  //Check duplicate email, chuẩn hóa lower-case
  const uniqueEmails = Array.from(new Set(invitedEmails.map(email => email.toLowerCase())));

  // Tính thời gian hết hạn
  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000
  );

  //Duyệt qua từng email và xử lý song song
  const results = await Promise.all(
    uniqueEmails.map(async (email) => {

  // Kiểm tra xem mail đã có invite active chưa
  const existing = await CourseInviteModel.findOne({
    courseId,
    invitedEmail: email,
    isActive: true,
    expiresAt: { $gt: new Date() },
    deletedAt: null //chỉ check deletedAt
  })

  if (existing) {
    return {
      email,
      skip: true,
      reason: "Existing active invite found",
    }
  }

  // Tạo token ngẫu nhiên 32 bytes = 64 ký tự hex
  const token = crypto.randomBytes(32).toString("hex");

  // Hash token bằng SHA256 để lưu vào DB
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");


  // Tạo invite record
  const invite = await CourseInviteModel.create({
    tokenHash,
    courseId,
    createdBy,
    invitedEmail: email,
    maxUses,
    expiresAt,
    isActive: true,
  });

// kiểm tra tạo invite trong db thành công chưa
  appAssert(invite, INTERNAL_SERVER_ERROR, "Failed to create invite link");

  // Tạo link với token gốc (KHÔNG lưu token gốc vào DB)
  const inviteLink = `${APP_ORIGIN}/courses/join?token=${token}`;

  return {
      email,
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
  }));

  return {
    courseId,
    invitedCount: results.length,
    invites: results
  }
};

/**
 * Yêu cầu nghiệp vụ:
 * - Student click vào link mời để tham gia khóa học
 * - Student phải đã đăng nhập (nếu chưa đăng nhập → FE redirect đến trang đăng nhập)
 * - Hash token từ query string và tìm trong DB
 * - Kiểm tra link còn hợp lệ (chưa hết hạn, chưa vượt giới hạn, đang active)
 * - Kiểm tra email đăng nhập phải trùng với email được invite
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

  //Check deleted, chặn sử dụng link đã xóa
  appAssert(
    !invite.deletedAt,
    BAD_REQUEST,
    "This invite link has been deleted"
  );

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

  /**
   * Yêu cầu nghiệp vụ:
   * - Lấy danh sách các lời mời tham gia khóa học (course invites) dựa trên filter đầu vào.
   * - Chỉ cho phép giáo viên (instructor), trợ giảng (teaching assistant) hoặc admin của khóa học xem danh sách này.
   * - Hỗ trợ filter theo: courseId, invitedEmail, isActive, phân trang (page, limit).
   * - Nếu là admin site/ hệ thống thì được phép query tất cả lời mời.
   * - Nếu là giáo viên/trợ giảng thì chỉ query được lời mời của các khóa học do mình quản lý (ít nhất là instructor/course admin).
   * 
   * Input:
   *   - query: object chứa các filter (courseId?, invitedEmail?, isActive?, page, limit)
   *   - viewerId: id người dùng thực hiện (string)
   *   - viewerRole: vai trò của người dùng thực hiện (Role)
   * Output:
   *   - Trả về danh sách course invites cùng pagination info
   * Trường hợp đặc biệt:
   *   - Nếu không có quyền truy cập → trả lỗi FORBIDDEN
   */

export const listCourseInvites = async (
  query: TListCourseInvite,
  viewerId: string,
  viewerRole: Role,
) => {
  const { courseId, invitedEmail, isActive, page, limit, from, to } = query;
// Build filter query
  const filter: FilterQuery<ICourseInvite> = {
    deletedAt: null, //Mặc định ẩn invite đã xóa
  };
  // Filter by courseId
  if(courseId) {
    filter.courseId = courseId;
  }
  // Filter by invitedEmail
  if(invitedEmail) {
    filter.invitedEmail = { $regex: invitedEmail, $options: "i" };
  }
  // Filter by isActive
  if(isActive !== undefined) {
    filter.isActive = isActive;
  }
  // Filter by date range
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }
  // Teacher chỉ xem được invite thuộc các khóa học họ dạy
  if (viewerRole === Role.TEACHER) {
    const teacherCourses = await CourseModel.find({ teacherIds: viewerId }).select("_id"); //lấy id của khóa học họ dạy(1)
    const allowedCourseIds = teacherCourses.map((course) => course._id); //lấy ra list id của khóa học họ dạy(all)
    // nếu courseId được cung cấp, chỉ xem invite của khóa học đó
    // nếu không, xem tất cả invites của khóa học họ dạy
    filter.courseId = courseId
      ? courseId
      : { $in: allowedCourseIds };
  }
  // Calculate pagination
  const skip = (page - 1) * limit;
  // 
  const [invites, total] = await Promise.all([
    CourseInviteModel.find(filter)
      .populate("courseId", "title isPublished")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CourseInviteModel.countDocuments(filter),
  ]);

  const results = invites.map((invite) => ({
    id: invite._id,
    course: invite.courseId,
    invitedEmail: invite.invitedEmail,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    expiresAt: invite.expiresAt,
    isActive: invite.isActive,
    createdAt: invite.createdAt,
    createdBy: invite.createdBy,
  }));

  return {
    invites: results,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + results.length < total,
      hasPrev: page > 1,
    },
  };
};

/** 
 * Yêu cầu nghiệp vụ: Cập nhật thông tin invite link
 * 
 * Authorization:
 * - Chỉ teacher của khóa học hoặc admin mới được cập nhật
 * 
 * Business Rules:
 * 1. expiresInDays: Tính lại expiresAt = now + expiresInDays (days)
 * 2. maxUses: Phải >= usedCount hiện tại, cho phép null (unlimited)
 * 3. isActive = false: Vô hiệu hóa invite
 * 4. isActive = true: Kích hoạt invite nếu thỏa mãn:
 *    - Chưa hết hạn (expiresAt > now) OR đang update expiresInDays
 *    - Chưa hết lượt (usedCount < maxUses) OR đang update maxUses
 * 
 * Input: inviteId, data { isActive?, expiresInDays?, maxUses? }, updatedBy
 * Output: Updated invite record
 */
export const updateCourseInvite = async (
  inviteId: string,
  data: TUpdateCourseInvite,
  updatedBy: string
) => {
  // Tìm invite trong DB
  const invite = await CourseInviteModel.findById(inviteId).populate(
    "courseId",
    "title teacherIds"
  );
  appAssert(invite, NOT_FOUND, "Course invite not found");

  //CRITICAL: Không cho phép update invite đã xóa
  appAssert(
    !invite.deletedAt,
    BAD_REQUEST,
    "Cannot update deleted invite. Please create a new one."
  );

  // Kiểm tra quyền: chỉ teacher của khóa học hoặc admin mới cập nhật được
  const user = await UserModel.findById(updatedBy);
  appAssert(user, NOT_FOUND, "User not found");

  if (user.role !== Role.ADMIN) {
    const course = invite.courseId as any;
    const isTeacherOfCourse = course.teacherIds.some(
      (teacherId: any) => teacherId.toString() === updatedBy
    );
    appAssert(
      isTeacherOfCourse,
      FORBIDDEN,
      "Only course teachers or admin can update invite links"
    );
  }
  
  //Validate khi enable invite
  if (data.isActive === true) {
    // Nếu không update expiresInDays, check expiresAt hiện tại
    const effectiveExpiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : invite.expiresAt;

    // Check expire
    if (effectiveExpiresAt && new Date() > effectiveExpiresAt) {
      appAssert(
        false,
        BAD_REQUEST,
        "Cannot enable expired invite. Please update expiresInDays first."
      );
    }

    // Check maxUses
    const effectiveMaxUses = data.maxUses !== undefined ? data.maxUses : invite.maxUses;
    if (effectiveMaxUses && invite.usedCount >= effectiveMaxUses) {
      appAssert(
        false,
        BAD_REQUEST,
        "Cannot enable invite that has reached max uses. Please increase maxUses first."
      );
    }
  }

  // Cập nhật isActive nếu có
  if (data.isActive !== undefined) {
    invite.isActive = data.isActive;
  }

  // Cập nhật expiresAt nếu có expiresInDays
  if (data.expiresInDays !== undefined) {
    invite.expiresAt = new Date(
      Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000
    );
  }

  // Cập nhật maxUses nếu có
  if (data.maxUses !== undefined) {
    // Kiểm tra maxUses không được nhỏ hơn usedCount hiện tại
    appAssert(
      data.maxUses === null || data.maxUses >= invite.usedCount,
      BAD_REQUEST,
      `maxUses cannot be less than current usedCount (${invite.usedCount})`
    );
    invite.maxUses = data.maxUses;
  }

  // Lưu thay đổi
  const updatedInvite = await invite.save();
  appAssert(updatedInvite, INTERNAL_SERVER_ERROR, "Failed to update invite link");

  return {
    id: updatedInvite._id,
    courseId: updatedInvite.courseId,
    invitedEmail: updatedInvite.invitedEmail,
    maxUses: updatedInvite.maxUses,
    usedCount: updatedInvite.usedCount,
    expiresAt: updatedInvite.expiresAt,
    isActive: updatedInvite.isActive,
    createdAt: updatedInvite.createdAt,
    updatedAt: updatedInvite.updatedAt,
  };
};

/**
 * Yêu cầu nghiệp vụ: Xóa invite link vĩnh viễn
 * 
 * Khác biệt với PATCH disable:
 * - PATCH disable: Tạm ngưng, có thể enable lại bất cứ lúc nào
 * - DELETE: Xóa vĩnh viễn, KHÔNG THỂ enable lại, ẩn khỏi danh sách
 * 
 * Business Rules:
 * 1. Chỉ teacher của course hoặc admin mới được xóa
 * 2. Invite đã xóa (isDeleted=true) không thể:
 *    - Enable lại (kể cả PATCH)
 *    - Sử dụng token để join course
 *    - Hiển thị trong list (mặc định)
 * 3. Invite đã xóa vẫn:
 *    - Tồn tại trong DB (soft delete)
 *    - Giữ history và statistics (usedCount, invitedEmails)
 *    - Có thể xem qua query đặc biệt (với param includeDeleted=true)
 * 4. Có thể xóa invite ở bất kỳ trạng thái nào (active/inactive)
 * 
 * Input: inviteId, userId
 * Output: Success message
 */
export const deleteCourseInvite = async (
  inviteId: string,
  userId: string
) => {
  // 1. Tìm invite
  const invite = await CourseInviteModel.findById(inviteId).populate(
    "courseId",
    "title teacherIds"
  );
  appAssert(invite, NOT_FOUND, "Course invite not found");

  // 2. Kiểm tra quyền (same as PATCH)
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  if (user.role !== Role.ADMIN) {
    const course = invite.courseId as any;
    const isTeacherOfCourse = course.teacherIds.some(
      (teacherId: any) => teacherId.toString() === userId
    );
    appAssert(
      isTeacherOfCourse,
      FORBIDDEN,
      "Only course teachers or admin can delete invite links"
    );
  }

  // 3. Kiểm tra đã xóa chưa (idempotent - không throw error)
  if (invite.deletedAt) {
    return {
      message: "Invite already deleted",
      deletedAt: invite.deletedAt,
    };
  }
         
  // 4. Soft delete - đánh dấu xóa
  invite.deletedAt = new Date();
  invite.isActive = false; 
  await invite.save();

  return {
    message: "Invite deleted successfully",
    deletedAt: invite.deletedAt,
  };
};