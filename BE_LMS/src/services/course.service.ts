

import CourseModel from "../models/course.model";
import SpecialistModel from "../models/specialist.model";
import UserModel from "../models/user.model";
import appAssert from "../utils/appAssert";
import { NOT_FOUND, BAD_REQUEST, FORBIDDEN } from "../constants/http";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "../validators/course.schemas";
import { CourseStatus } from "../types/course.type";
import { Role, UserStatus } from "../types/user.type";

export type ListCoursesParams = {
  page: number;
  limit: number;
  search?: string;
  subjectId?: string; // ✅ NEW: Filter by subject instead of specialist
  teacherId?: string;
  isPublished?: boolean;
  status?: CourseStatus;
  includeDeleted?: boolean; // Admin only - include deleted courses in results
  onlyDeleted?: boolean; // Admin only - show only deleted courses
  sortBy?: string;
  sortOrder?: string;
  userRole?: Role; // ✅ FIX: Added to check permissions for viewing deleted courses
};

/**
 * Lấy danh sách khóa học với filter, search, sort và pagination
 * 
 * YÊU CẦU NGHIỆP VỤ - SOFT DELETE:
 * 1. Mặc định chỉ show courses chưa bị xóa (isDeleted: false)
 * 2. Admin có thể xem courses đã xóa với query param:
 *    - ?includeDeleted=true → Show cả active và deleted courses
 *    - ?onlyDeleted=true → Chỉ show deleted courses (recycle bin)
 * 3. Regular users luôn chỉ thấy active courses
 */
export const listCourses = async ({
  page,
  limit,
  search,
  subjectId,
  teacherId,
  isPublished,
  status,
  includeDeleted,
  onlyDeleted,
  sortBy = "createdAt",
  sortOrder = "desc",
  userRole,
}: ListCoursesParams) => {
  // ❌ FIX: Validate pagination parameters
  appAssert(
    page > 0 && page <= 10000,
    BAD_REQUEST,
    "Page must be between 1 and 10000"
  );
  appAssert(
    limit > 0 && limit <= 100,
    BAD_REQUEST,
    "Limit must be between 1 and 100"
  );

  // ❌ FIX: Validate sortBy field
  const allowedSortFields = ["createdAt", "updatedAt", "title", "startDate", "endDate", "deletedAt"];
  appAssert(
    allowedSortFields.includes(sortBy),
    BAD_REQUEST,
    `Invalid sort field. Allowed: ${allowedSortFields.join(", ")}`
  );

  // ❌ FIX: Validate subjectId/teacherId if provided
  if (subjectId) {
    appAssert(
      subjectId.match(/^[0-9a-fA-F]{24}$/),
      BAD_REQUEST,
      "Invalid subject ID format"
    );
  }
  if (teacherId) {
    appAssert(
      teacherId.match(/^[0-9a-fA-F]{24}$/),
      BAD_REQUEST,
      "Invalid teacher ID format"
    );
  }

  // Build filter query
  const filter: any = {};

  // ✅ SOFT DELETE: Control deleted course visibility
  // ✅ FIX: Only admin can view deleted courses
  const isAdmin = userRole === Role.ADMIN;
  
  if (onlyDeleted) {
    // Admin viewing recycle bin
    if (!isAdmin) {
      // Non-admin cannot view recycle bin - show normal courses instead
      filter.isDeleted = false;
    } else {
      filter.isDeleted = true;
    }
  } else if (includeDeleted) {
    // Admin viewing all courses (both deleted and non-deleted)
    if (!isAdmin) {
      // Non-admin cannot include deleted courses
      filter.isDeleted = false;
    }
    // Admin: no filter on isDeleted, show both
  } else {
    // Default: Only show non-deleted courses
    filter.isDeleted = false;
  }

  // Filter by published status
  if (isPublished !== undefined) {
    filter.isPublished = isPublished;
  }

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // ✅ NEW: Filter by subject ID
  if (subjectId) {
    filter.subjectId = subjectId;
  }

  // Filter by teacher ID
  if (teacherId) {
    filter.teacherIds = teacherId;
  }

    // Search by title or description (text search)
    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
        ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute query with pagination
  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .populate("teacherIds", "username email fullname avatar_url")
      .populate("subjectId", "name code slug description credits")
      .populate("createdBy", "username email fullname")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        courses,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

/**
 * Lấy thông tin chi tiết một khóa học theo ID
 */
export const getCourseById = async (courseId: string) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    "Invalid course ID format"
  );

  // ✅ SOFT DELETE: Only get non-deleted course
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  })
    .populate("teacherIds", "username email fullname avatar_url bio")
    .populate("subjectId", "name code slug description credits")
    .populate("createdBy", "username email fullname")
    .lean();

  appAssert(course, NOT_FOUND, "Course not found");

  return course;
};

/**
 * Tạo khóa học mới
 */
export const createCourse = async (
  data: CreateCourseInput,
  userId: string
) => {
  // ❌ FIX: Validate teacherIds array
  appAssert(
    data.teacherIds && data.teacherIds.length > 0,
    BAD_REQUEST,
    "At least one teacher is required"
  );

  // ❌ FIX: Check duplicate teacherIds
  const uniqueTeachers = new Set(data.teacherIds.map(id => id.toString()));
  appAssert(
    uniqueTeachers.size === data.teacherIds.length,
    BAD_REQUEST,
    "Teacher list contains duplicate entries"
  );

  // Validate dates
  appAssert(data.startDate, BAD_REQUEST, "Start date is required");
  appAssert(data.endDate, BAD_REQUEST, "End date is required");

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  appAssert(
    endDate > startDate,
    BAD_REQUEST,
    "End date must be after start date"
  );

  // ✅ UNIVERSITY RULE: Validate subject exists
  const SubjectModel = (await import("../models/subject.model")).default;
  const subject = await SubjectModel.findById(data.subjectId);
  appAssert(subject, NOT_FOUND, "Subject not found");
  appAssert(subject.isActive, BAD_REQUEST, "Cannot create course for inactive subject");

  // ✅ UNIVERSITY RULE: Validate capacity is reasonable
  if (data.capacity !== undefined) {
    appAssert(
      data.capacity > 0 && data.capacity <= 500,
      BAD_REQUEST,
      "Capacity must be between 1 and 500 students"
    );
  }

  // Validate all teachers exist and have correct roles
  const teachers = await UserModel.find({
    _id: { $in: data.teacherIds },
  });

  appAssert(
    teachers.length === data.teacherIds.length,
    BAD_REQUEST,
    "One or more teachers not found"
  );

  // Check if all users have teacher or admin role
  const allAreTeachers = teachers.every((teacher) => {
    return teacher.role === Role.TEACHER || teacher.role === Role.ADMIN;
  });

  appAssert(
    allAreTeachers,
    BAD_REQUEST,
    "All assigned users must have teacher or admin role"
  );

  // ❌ FIX: Check if teachers are active (not banned/inactive)
  const allTeachersActive = teachers.every((teacher) => {
    return teacher.status === UserStatus.ACTIVE;
  });

  appAssert(
    allTeachersActive,
    BAD_REQUEST,
    "Cannot assign inactive or banned teachers to course"
  );

  // ✅ YÊU CẦU 2: Teacher tạo course cần Admin approve
  // Get creator info to determine permissions
  const creator = await UserModel.findById(userId);
  appAssert(creator, BAD_REQUEST, "Creator user not found");

  const isAdmin = creator.role === Role.ADMIN;

  // Determine final status and publish state
  let finalIsPublished = data.isPublished || false;
  let finalStatus = data.status || CourseStatus.DRAFT;

  if (!isAdmin) {
    // Teacher CANNOT publish course immediately - cần admin approve
    // Force isPublished = false regardless of input
    finalIsPublished = false;
  } else {
    // ✅ AUTO STATUS: Admin tạo và publish luôn → status = ONGOING
    if (finalIsPublished && finalStatus === CourseStatus.DRAFT) {
      finalStatus = CourseStatus.ONGOING;
    }
  }

  // Create course with createdBy
  const courseData = {
    ...data,
    startDate,
    endDate,
    status: finalStatus,
    isPublished: finalIsPublished,
    createdBy: userId,
  };

  const course = await CourseModel.create(courseData);

  // ❌ FIX: Ensure course was created
  appAssert(course, BAD_REQUEST, "Failed to create course");

  // Populate and return
  const populatedCourse = await CourseModel.findById(course._id)
    .populate("teacherIds", "username email fullname avatar_url")
    .populate("subjectId", "name code slug description credits")
    .populate("createdBy", "username email fullname")
    .lean();

  // ❌ FIX: Ensure populated course exists
  appAssert(populatedCourse, BAD_REQUEST, "Failed to retrieve created course");

  return populatedCourse;
};

/**
 * Cập nhật khóa học
 */
export const updateCourse = async (
    courseId: string,
    data: UpdateCourseInput,
    userId: string
) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    "Invalid course ID format"
  );

  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, "Course not found");

  // ❌ FIX: Cannot update completed course
  appAssert(
    course.status !== CourseStatus.COMPLETED,
    BAD_REQUEST,
    "Cannot update a completed course"
  );

    // Check if user is a teacher of this course or admin
    const user = await UserModel.findById(userId);
    appAssert(user, NOT_FOUND, "User not found");

  const isTeacherOfCourse = course.teacherIds.some(
    (teacherId) => teacherId.toString() === userId
  );

  const isAdmin = user.role === Role.ADMIN;

  appAssert(
    isTeacherOfCourse || isAdmin,
    FORBIDDEN,
    "You don't have permission to update this course"
  );

  // Validate dates if provided
  if (data.startDate || data.endDate) {
    const startDate = data.startDate
      ? new Date(data.startDate)
      : course.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : course.endDate;

    appAssert(
      endDate > startDate,
      BAD_REQUEST,
      "End date must be after start date"
    );

    // ❌ FIX: Cannot change startDate if course already started
    if (data.startDate) {
      const now = new Date();
      appAssert(
        course.startDate > now,
        BAD_REQUEST,
        "Cannot change start date of a course that has already started"
      );
      data.startDate = startDate as any;
    }

    if (data.endDate) data.endDate = endDate as any;
  }

  // Validate teachers if provided
  if (data.teacherIds) {
    const teachers = await UserModel.find({
      _id: { $in: data.teacherIds },
    });

    appAssert(
      teachers.length === data.teacherIds.length,
      BAD_REQUEST,
      "One or more teachers not found"
    );

    const allAreTeachers = teachers.every((teacher) => {
      return teacher.role === Role.TEACHER || teacher.role === Role.ADMIN;
    });

    appAssert(
      allAreTeachers,
      BAD_REQUEST,
      "All assigned users must have teacher or admin role"
    );

  }

  // ✅ YÊU CẦU 2: Only Admin can approve/publish courses
  // Teacher không thể tự publish course của mình
  // Prepare update data
  const updateData = { ...data };

  // If teacher tries to publish course, prevent it
  if (!isAdmin && data.isPublished === true) {
    // Teacher cannot publish - only admin can approve
    delete updateData.isPublished;
    // Note: Course will remain unpublished, need admin to approve
  }

  // ✅ AUTO STATUS: When admin approves (publishes) a DRAFT course, auto change to ONGOING
  if (isAdmin && data.isPublished === true && course.status === CourseStatus.DRAFT) {
    updateData.status = CourseStatus.ONGOING;
  }

  // Update course
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("teacherIds", "username email fullname avatar_url")
    .populate("subjectId", "name code slug description credits")
    .populate("createdBy", "username email fullname")
    .lean();

  // ❌ FIX: Ensure course was updated successfully
  appAssert(updatedCourse, BAD_REQUEST, "Failed to update course");

  return updatedCourse;
};

/**
 * Xóa mềm khóa học (Soft Delete)
 * 
 * YÊU CẦU NGHIỆP VỤ:
 * 1. Course không bị xóa thật khỏi database
 * 2. Chỉ đánh dấu isDeleted = true, lưu thời gian và người xóa
 * 3. Course đã xóa không hiển thị trong list/get operations
 * 4. Admin có thể khôi phục course đã xóa (future feature)
 * 5. Chỉ teacher của course hoặc admin mới có quyền xóa
 */
export const deleteCourse = async (courseId: string, userId: string) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    "Invalid course ID format"
  );

  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, "Course not found or already deleted");

  // ❌ FIX: Cannot delete ongoing course
  appAssert(
    course.status !== CourseStatus.ONGOING,
    BAD_REQUEST,
    "Cannot delete an ongoing course. Please complete or cancel it first."
  );

  // ✅ UNIVERSITY BUSINESS RULE: Check for active enrollments
  const EnrollmentModel = (await import("../models/enrollment.model")).default;
  const activeEnrollmentCount = await EnrollmentModel.countDocuments({
    courseId,
    status: { $in: ["pending", "approved"] }, // Active enrollments
  });
  
  appAssert(
    activeEnrollmentCount === 0,
    BAD_REQUEST,
    `Cannot delete course with ${activeEnrollmentCount} active enrollment(s). Please cancel or complete all enrollments first.`
  );

    // Check if user is a teacher of this course or admin
    const user = await UserModel.findById(userId);
    appAssert(user, NOT_FOUND, "User not found");

  const isTeacherOfCourse = course.teacherIds.some(
    (teacherId) => teacherId.toString() === userId
  );
  const isAdmin = user.role === Role.ADMIN;

  appAssert(
    isTeacherOfCourse || isAdmin,
    FORBIDDEN,
    "You don't have permission to delete this course"
  );

  // ✅ SOFT DELETE: Mark as deleted instead of removing from database
  await CourseModel.findByIdAndUpdate(
    courseId,
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    },
    { new: true }
  );

  return { 
    message: "Course deleted successfully",
    deletedAt: new Date(),
    deletedBy: userId,
  };
};

/**
 * Khôi phục khóa học đã xóa (Restore Deleted Course)
 * 
 * YÊU CẦU NGHIỆP VỤ:
 * 1. Chỉ admin mới có quyền khôi phục course
 * 2. Course phải đang ở trạng thái deleted (isDeleted = true)
 * 3. Sau khi restore, course trở lại trạng thái active
 * 4. Clear deletedAt và deletedBy fields
 */
export const restoreCourse = async (courseId: string, userId: string) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    "Invalid course ID format"
  );

  // ✅ Find deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: true,
  });
  appAssert(course, NOT_FOUND, "Deleted course not found");

  // Check if user is admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  const isAdmin = user.role === Role.ADMIN;

  appAssert(
    isAdmin,
    FORBIDDEN,
    "Only administrators can restore deleted courses"
  );

  // ✅ RESTORE: Mark as not deleted
  const restoredCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    },
    { new: true }
  )
    .populate("teacherIds", "username email fullname avatar_url")
    .populate("subjectId", "name code slug description credits")
    .populate("createdBy", "username email fullname")
    .lean();

  return {
    message: "Course restored successfully",
    course: restoredCourse,
  };
};

/**
 * Xóa vĩnh viễn khóa học khỏi database (Hard Delete / Permanent Delete)
 * 
 * YÊU CẦU NGHIỆP VỤ:
 * 1. CHỈ Admin mới có quyền xóa vĩnh viễn
 * 2. CHỈ xóa được courses đã ở trạng thái deleted (isDeleted=true)
 * 3. Course bị xóa THẬT khỏi database, KHÔNG thể khôi phục
 * 4. Thường dùng để dọn dẹp "Recycle Bin"
 * 5. CẢNH BÁO: Action này không thể hoàn tác (irreversible)
 * 
 * LƯU Ý: Nên check enrollments, lessons, quizzes... trước khi xóa vĩnh viễn
 */
export const permanentDeleteCourse = async (
  courseId: string,
  userId: string
) => {
  // ✅ Find deleted course only (must be soft-deleted first)
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: true, // IMPORTANT: Chỉ xóa được courses đã soft delete
  });
  appAssert(
    course,
    NOT_FOUND,
    "Course not found in recycle bin. Only deleted courses can be permanently deleted."
  );

  // ✅ Check if user is admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  const isAdmin = user.role === Role.ADMIN;

  appAssert(
    isAdmin,
    FORBIDDEN,
    "Only administrators can permanently delete courses"
  );

  // ⚠️ OPTIONAL: Check if course has related data
  // Uncomment if you want to prevent deletion of courses with enrollments
  // const EnrollmentModel = require("../models/enrollment.model").default;
  // const enrollmentCount = await EnrollmentModel.countDocuments({ courseId });
  // appAssert(
  //   enrollmentCount === 0,
  //   BAD_REQUEST,
  //   `Cannot permanently delete course with ${enrollmentCount} enrollment(s). Please remove enrollments first.`
  // );

  // ✅ HARD DELETE: Remove from database permanently
  await CourseModel.findByIdAndDelete(courseId);

  return {
    message: "Course permanently deleted successfully",
    warning: "This action cannot be undone",
    deletedCourseId: courseId,
  };
};
