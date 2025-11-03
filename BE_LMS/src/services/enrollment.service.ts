import { NOT_FOUND, BAD_REQUEST, CONFLICT, UNAUTHORIZED } from "../constants/http";
import EnrollmentModel from "../models/enrollment.model";
import CourseModel from "../models/course.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { compareValue } from "../utils/bcrypt";
import { CourseStatus } from "../types/course.type";
import { EnrollmentStatus } from "@/types/enrollment.type";

// Ensure models are registered
void CourseModel;
void UserModel;

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy thông tin chi tiết của một enrollment theo ID
 * - Hiển thị thông tin student (username, email, fullname, avatar_url)
 * - Hiển thị thông tin course (title, code, description)
 * - Nếu enrollmentId không tồn tại → trả lỗi NOT_FOUND
 * 
 * Input: enrollmentId (string)
 * Output: Enrollment với thông tin student và course đã populate
 */
export const getEnrollmentById = async (enrollmentId: string) => {
  const enrollment = await EnrollmentModel.findById(enrollmentId)
    .populate("studentId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  appAssert(enrollment, NOT_FOUND, "Enrollment not found");
  return enrollment;
};

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy danh sách tất cả enrollment của một student cụ thể
 * - Có thể filter theo status (pending, approved, rejected, cancelled, dropped, completed)
 * - Hỗ trợ phân trang (page, limit)
 * - Sắp xếp theo thời gian tạo mới nhất (createdAt desc)
 * - Populate thông tin course (title, code, description, category, teachers, isPublished)
 * 
 * Input: 
 * - studentId (string, bắt buộc)
 * - status (string, optional)
 * - page (number, default: 1)
 * - limit (number, default: 10)
 * 
 * Output: 
 * - enrollments: Danh sách enrollment của student
 * - pagination: { total, page, limit, totalPages }
 */
export const getStudentEnrollments = async (filters: {
  studentId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { studentId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = { studentId };
  if (status) {
    query.status = status;
  }

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("courseId", "title code description category teachers isPublished")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy danh sách tất cả enrollment của một khóa học cụ thể
 * - Kiểm tra course tồn tại trước → nếu không tồn tại trả lỗi NOT_FOUND
 * - Có thể filter theo status
 * - Hỗ trợ phân trang (page, limit)
 * - Sắp xếp theo thời gian tạo mới nhất (createdAt desc)
 * - Populate thông tin student (username, email, fullname, avatar_url)
 * 
 * Input:
 * - courseId (string, bắt buộc)
 * - status (string, optional)
 * - page (number, default: 1)
 * - limit (number, default: 10)
 * 
 * Output:
 * - enrollments: Danh sách enrollment của course
 * - pagination: { total, page, limit, totalPages }
 */
export const getCourseEnrollments = async (filters: {
  courseId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { courseId, status, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  // Check if course exists
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  const query: any = { courseId };
  if (status) {
    query.status = status;
  }

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("studentId", "username email fullname avatar_url")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Yêu cầu nghiệp vụ:
 * - Lấy toàn bộ danh sách enrollment trong hệ thống (dành cho admin)
 * - Hỗ trợ filter đa điều kiện: status, courseId, studentId
 * - Hỗ trợ phân trang (page, limit)
 * - Sắp xếp theo thời gian tạo mới nhất (createdAt desc)
 * - Populate cả thông tin student và course
 * 
 * Input:
 * - status (string, optional)
 * - courseId (string, optional)
 * - studentId (string, optional)
 * - page (number, default: 1)
 * - limit (number, default: 10)
 * 
 * Output:
 * - enrollments: Danh sách tất cả enrollment theo filter
 * - pagination: { total, page, limit, totalPages }
 */
export const getAllEnrollments = async (filters: {
  status?: string;
  courseId?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, courseId, studentId, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (status) query.status = status;
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  const [enrollments, total] = await Promise.all([
    EnrollmentModel.find(query)
      .populate("studentId", "username email fullname avatar_url")
      .populate("courseId", "title code description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentModel.countDocuments(query),
  ]);

  return {
    enrollments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Yêu cầu nghiệp vụ:
 * - Tạo enrollment mới cho student vào một khóa học
 * - Kiểm tra student tồn tại → nếu không tồn tại trả lỗi NOT_FOUND
 * - Kiểm tra course tồn tại và status = ONGOING → nếu không trả lỗi NOT_FOUND hoặc BAD_REQUEST
 * - Nếu course có password → yêu cầu nhập password đúng (với method = "self")
 * - Xác định status mặc định dựa vào enrollRequiresApproval của course:
 *   + Nếu enrollRequiresApproval = true → status = "pending"
 *   + Nếu enrollRequiresApproval = false → status = "approved"
 * - Kiểm tra enrollment đã tồn tại (theo FPT LMS logic):
 *   + Nếu status cũ = REJECTED hoặc CANCELLED → CHO PHÉP re-enroll (cập nhật lại)
 *   + Nếu status cũ = DROPPED hoặc COMPLETED → KHÔNG CHO PHÉP (phải học khóa KHÁC)
 *   + Nếu status cũ = PENDING hoặc APPROVED → KHÔNG CHO PHÉP (trả lỗi CONFLICT)
 * - Kiểm tra capacity (sức chứa) của course → nếu đầy trả lỗi BAD_REQUEST
 * - Tạo enrollment mới với các thông tin: studentId, courseId, status, role, method, note
 * 
 * Input:
 * - studentId (string, bắt buộc)
 * - courseId (string, bắt buộc)
 * - status (string, optional - mặc định theo enrollRequiresApproval)
 * - role (string, default: "student")
 * - method (string, default: "self")
 * - note (string, optional)
 * - password (string, optional - bắt buộc nếu course có password và method = "self")
 * 
 * Output: Enrollment mới được tạo (hoặc cập nhật) với thông tin student và course đã populate
 */
export const createEnrollment = async (data: {
  studentId: string;
  courseId: string;
  status?: "pending" | "approved";
  role?: "student" | "auditor";
  method?: "self" | "invited" | "password" | "other";
  note?: string;
  password?: string;
}) => {
  const { studentId, courseId, role = "student", method = "self", note, password } = data;

  // 1. Check student exists
  const student = await UserModel.findById(studentId);
  appAssert(student, NOT_FOUND, "Student not found");

  // 2. Check course exists and status
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, "Course not found");
  // Only allow enrollment for ongoing courses (not draft/deleted)
  appAssert(
    course.status === CourseStatus.ONGOING,
    BAD_REQUEST,
    "Course is not available for enrollment. Only ongoing courses can be enrolled."
  );

  // 2.1. Check password if course is password-protected
  if (course.enrollPasswordHash && method === "self") {
    appAssert(password, BAD_REQUEST, "Password is required for this course");
    const isValidPassword = await compareValue(password, course.enrollPasswordHash);
    appAssert(isValidPassword, UNAUTHORIZED, "Invalid course password");
  }

  // 2.2. Determine default status based on enrollRequiresApproval
  const defaultStatus = data.status || (course.enrollRequiresApproval ? EnrollmentStatus.PENDING : EnrollmentStatus.APPROVED);
  // Validate: Only pending or approved can be set when creating enrollment
  appAssert(
    defaultStatus === EnrollmentStatus.PENDING || defaultStatus === EnrollmentStatus.APPROVED,
    BAD_REQUEST,
    "Enrollment status must be 'pending' or 'approved'"
  );
  const status = defaultStatus;

  // 3. Check existing enrollment
  const existingEnrollment = await EnrollmentModel.findOne({
    studentId,
    courseId,
  });

  // Nếu đã có enrollment
  if (existingEnrollment) {
    // Chỉ cho phép re-enroll khi status = REJECTED hoặc CANCELLED
    // - REJECTED: Enrollment bị từ chối duyệt → có thể đăng ký lại
    // - CANCELLED: Student tự hủy enrollment → có thể đăng ký lại
    // 
    // KHÔNG cho phép re-enroll khi:
    // - DROPPED: Bị đánh rớt → phải đăng ký môn đó ở khóa học KHÁC
    // - COMPLETED: Đã hoàn thành → phải đăng ký môn đó ở khóa học KHÁC
    // - PENDING: Đang chờ duyệt → không cần enroll lại
    // - APPROVED: Đang học → không thể enroll lại
    const reEnrollableStatuses = [
      EnrollmentStatus.REJECTED,
      EnrollmentStatus.CANCELLED,
    ];

    if (reEnrollableStatuses.includes(existingEnrollment.status as EnrollmentStatus)) {
      // Verify password again for re-enrollment if needed
      if (course.enrollPasswordHash && method === "self") {
        appAssert(password, BAD_REQUEST, "Password is required for this course");
        const isValidPassword = await compareValue(password, course.enrollPasswordHash);
        appAssert(isValidPassword, UNAUTHORIZED, "Invalid course password");
      }

      existingEnrollment.status = status as any;
      existingEnrollment.role = role as any;
      existingEnrollment.method = method as any;
      existingEnrollment.note = note;
      existingEnrollment.finalGrade = undefined; // Reset grade
      existingEnrollment.progress = { totalLessons: 0, completedLessons: 0 }; // Reset progress
      existingEnrollment.respondedBy = undefined;
      existingEnrollment.respondedAt = undefined;
      existingEnrollment.completedAt = undefined;
      existingEnrollment.droppedAt = undefined;
      await existingEnrollment.save();

      await existingEnrollment.populate([
        { path: "studentId", select: "username email fullname avatar_url" },
        { path: "courseId", select: "title code description" },
      ]);

      return existingEnrollment;
    }

    // Xử lý các trường hợp không được re-enroll với message cụ thể
    let errorMessage = "Already enrolled in this course";
    if (existingEnrollment.status === EnrollmentStatus.DROPPED) {
      errorMessage = "You have been dropped from this course. Please enroll in another course offering the same subject.";
    } else if (existingEnrollment.status === EnrollmentStatus.COMPLETED) {
      errorMessage = "You have already completed this course. Please enroll in another course offering the same subject.";
    } else if (existingEnrollment.status === EnrollmentStatus.PENDING) {
      errorMessage = "Your enrollment is pending approval.";
    } else if (existingEnrollment.status === EnrollmentStatus.APPROVED) {
      errorMessage = "You are already enrolled in this course.";
    }

    appAssert(false, CONFLICT, errorMessage);
  }

  // 4. Check course capacity
  if (course.capacity) {
    const enrolledCount = await EnrollmentModel.countDocuments({
      courseId,
      status: EnrollmentStatus.APPROVED,
    });
    appAssert(
      enrolledCount < course.capacity,
      BAD_REQUEST,
      "Course is full"
    );
  }

  // 5. Create enrollment
  const enrollment = await EnrollmentModel.create({
    studentId,
    courseId,
    status,
    role,
    method,
    note,
  });

  // Populate để trả về đầy đủ thông tin
  await enrollment.populate([
    { path: "studentId", select: "username email fullname avatar_url" },
    { path: "courseId", select: "title code description" },
  ]);

  return enrollment;
};

/**
 * Yêu cầu nghiệp vụ:
 * - Cập nhật thông tin enrollment (dành cho Admin hoặc Teacher)
 * - Kiểm tra enrollment tồn tại → nếu không tồn tại trả lỗi NOT_FOUND
 * - Cho phép cập nhật: status, role, finalGrade, note, respondedBy
 * - Tự động set timestamp khi status thay đổi:
 *   + status = "approved" hoặc "rejected" → set respondedAt = new Date()
 *   + status = "completed" → set completedAt = new Date()
 *   + status = "dropped" → set droppedAt = new Date()
 * - Nếu có respondedBy → gán vào trường respondedBy
 * 
 * Input:
 * - enrollmentId (string, bắt buộc)
 * - status (string, optional)
 * - role (string, optional)
 * - finalGrade (number, optional)
 * - note (string, optional)
 * - respondedBy (string, optional)
 * 
 * Output: Enrollment đã được cập nhật với thông tin student và course đã populate
 */
export const updateEnrollment = async (
  enrollmentId: string,
  data: {
    status?: "pending" | "approved" | "rejected" | "cancelled" | "dropped" | "completed";
    role?: "student" | "auditor";
    finalGrade?: number;
    note?: string;
    respondedBy?: string;
  }
) => {
  // 1. Check enrollment exists
  const enrollment = await EnrollmentModel.findById(enrollmentId);
  appAssert(enrollment, NOT_FOUND, "Enrollment not found");

  // 2. Update fields
  const updateData: any = {};
  if (data.status !== undefined) {
    updateData.status = data.status;
    
    // Tự động set timestamp khi status thay đổi
    if (data.status === EnrollmentStatus.APPROVED || data.status === EnrollmentStatus.REJECTED) {
      updateData.respondedAt = new Date();
      if (data.respondedBy) {
        updateData.respondedBy = data.respondedBy;
      }
    }
    if (data.status === EnrollmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    if (data.status === EnrollmentStatus.DROPPED) {
      updateData.droppedAt = new Date();
    }
  }
  if (data.role !== undefined) updateData.role = data.role;
  if (data.finalGrade !== undefined) updateData.finalGrade = data.finalGrade;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.respondedBy !== undefined) updateData.respondedBy = data.respondedBy;

  // 3. Update enrollment
  const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
    enrollmentId,
    updateData,
    { new: true } // Return updated document
  )
    .populate("studentId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  return updatedEnrollment;
};

/**
 * Yêu cầu nghiệp vụ:
 * - Student tự cập nhật enrollment của mình (chỉ được phép drop khóa học)
 * - Kiểm tra enrollment tồn tại và thuộc về student này → nếu không trả lỗi NOT_FOUND
 * - Không cho phép drop nếu course đã completed → trả lỗi BAD_REQUEST
 * - Khi drop → set status = "dropped" và droppedAt = new Date()
 * 
 * Input:
 * - enrollmentId (string, bắt buộc)
 * - studentId (string, bắt buộc - để verify ownership)
 * - status (string, chỉ nhận giá trị "dropped")
 * 
 * Output: Enrollment đã được cập nhật với thông tin student và course đã populate
 */
export const updateSelfEnrollment = async (
  enrollmentId: string,
  studentId: string,
  data: {
    status?: "dropped";
  }
) => {
  // 1. Check enrollment exists và thuộc về student này
  const enrollment = await EnrollmentModel.findOne({
    _id: enrollmentId,
    studentId,
  });
  appAssert(enrollment, NOT_FOUND, "Enrollment not found or access denied");

  // 2. Không cho phép drop nếu đã completed
  appAssert(
    enrollment.status !== EnrollmentStatus.COMPLETED,
    BAD_REQUEST,
    "Cannot drop a completed course"
  );

  // 3. Update status và timestamp
  const updateData: any = { status: data.status };
  if (data.status === EnrollmentStatus.DROPPED) {
    updateData.droppedAt = new Date();
  }

  const updatedEnrollment = await EnrollmentModel.findByIdAndUpdate(
    enrollmentId,
    updateData,
    { new: true }
  )
    .populate("studentId", "username email fullname avatar_url")
    .populate("courseId", "title code description");

  return updatedEnrollment;
};
