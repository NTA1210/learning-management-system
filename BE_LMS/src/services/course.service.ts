

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

export type ListCoursesParams = {
  page: number;
  limit: number;
  search?: string;
  specialistId?: string;
  teacherId?: string;
  code?: string;
  isPublished?: boolean;
  status?: CourseStatus;
  includeDeleted?: boolean; // Admin only - include deleted courses in results
  onlyDeleted?: boolean; // Admin only - show only deleted courses
  sortBy?: string;
  sortOrder?: string;
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
  specialistId,
  teacherId,
  code,
  isPublished,
  status,
  includeDeleted,
  onlyDeleted,
  sortBy = "createdAt",
  sortOrder = "desc",
}: ListCoursesParams) => {
  // Build filter query
  const filter: any = {};

  // ✅ SOFT DELETE: Control deleted course visibility
  if (onlyDeleted) {
    // Admin viewing recycle bin
    filter.isDeleted = true;
  } else if (includeDeleted) {
    // Admin viewing all courses (no filter on isDeleted)
    // Do nothing - show both deleted and non-deleted
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

  // Filter by specialist ID
  if (specialistId) {
    filter.specialistIds = specialistId;
  }

  // Filter by teacher ID
  if (teacherId) {
    filter.teacherIds = teacherId;
  }

    // Filter by course code (exact match, case-insensitive)
    if (code) {
        filter.code = {$regex: `^${code}$`, $options: "i"};
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
      .populate("specialistIds", "name slug description majorId")
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
  // ✅ SOFT DELETE: Only get non-deleted course
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  })
    .populate("teacherIds", "username email fullname avatar_url bio")
    .populate("specialistIds", "name slug description majorId")
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
    const role = teacher.role.trim().toUpperCase();
    return role === "TEACHER" || role === "ADMIN";
  });

  appAssert(
    allAreTeachers,
    BAD_REQUEST,
    "All assigned users must have teacher or admin role"
  );

  // ✅ YÊU CẦU 1: Validate teacher specialistIds phải khớp với course specialistIds
  if (data.specialistIds && data.specialistIds.length > 0) {
    for (const teacher of teachers) {
      const role = teacher.role.trim().toUpperCase();
      // Admin có thể dạy bất kỳ chuyên ngành nào
      if (role === "ADMIN") continue;

      // Teacher phải có ít nhất 1 specialist trùng với course
      const teacherSpecIds = teacher.specialistIds.map((id) => id.toString());
      const courseSpecIds = data.specialistIds.map((id) => id.toString());

      const hasMatchingSpecialty = courseSpecIds.some((specId) =>
        teacherSpecIds.includes(specId)
      );

      appAssert(
        hasMatchingSpecialty,
        BAD_REQUEST,
        `Teacher "${teacher.username}" does not have the required specialist credentials for this course. Teacher specialists: [${teacherSpecIds.join(
          ", "
        )}], Course requires: [${courseSpecIds.join(", ")}]`
      );
    }
  }

  // Validate specialists exist and are active (if provided)
  if (data.specialistIds && data.specialistIds.length > 0) {
    const specialists = await SpecialistModel.find({
      _id: { $in: data.specialistIds },
    });

    appAssert(
      specialists.length === data.specialistIds.length,
      BAD_REQUEST,
      "One or more specialists not found"
    );

    const allAreActive = specialists.every((spec) => spec.isActive === true);

    appAssert(
      allAreActive,
      BAD_REQUEST,
      "All specialists must be active"
    );
  }

  // Check if code is unique (if provided)
  if (data.code) {
    const existingCourse = await CourseModel.findOne({ code: data.code });
    appAssert(
      !existingCourse,
      BAD_REQUEST,
      "Course code already exists"
    );
  }

  // ✅ YÊU CẦU 2: Teacher tạo course cần Admin approve
  // Get creator info to determine permissions
  const creator = await UserModel.findById(userId);
  appAssert(creator, BAD_REQUEST, "Creator user not found");

  const creatorRole = creator.role.trim().toUpperCase();
  const isAdmin = creatorRole === "ADMIN";

  // Determine final status and publish state
  let finalIsPublished = data.isPublished || false;

  if (!isAdmin) {
    // Teacher CANNOT publish course immediately - cần admin approve
    // Force isPublished = false regardless of input
    finalIsPublished = false;
  }
  // Admin có thể tạo và publish ngay lập tức

  // Create course with createdBy
  const courseData = {
    ...data,
    startDate,
    endDate,
    status: data.status || CourseStatus.DRAFT,
    isPublished: finalIsPublished,
    createdBy: userId,
  };

  const course = await CourseModel.create(courseData);

  // Populate and return
  const populatedCourse = await CourseModel.findById(course._id)
    .populate("teacherIds", "username email fullname avatar_url")
    .populate("specialistIds", "name slug description majorId")
    .populate("createdBy", "username email fullname")
    .lean();

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
  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, "Course not found");

    // Check if user is a teacher of this course or admin
    const user = await UserModel.findById(userId);
    appAssert(user, NOT_FOUND, "User not found");

  const isTeacherOfCourse = course.teacherIds.some(
    (teacherId) => teacherId.toString() === userId
  );

  const userRole = user.role.trim().toUpperCase();
  const isAdmin = userRole === "ADMIN";

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

    if (data.startDate) data.startDate = startDate as any;
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
      const role = teacher.role.trim().toUpperCase();
      return role === "TEACHER" || role === "ADMIN";
    });

    appAssert(
      allAreTeachers,
      BAD_REQUEST,
      "All assigned users must have teacher or admin role"
    );

    // ✅ YÊU CẦU 1: Validate teacher specialistIds when updating
    const courseSpecIds =
      data.specialistIds || course.specialistIds || [];

    if (courseSpecIds.length > 0) {
      for (const teacher of teachers) {
        const role = teacher.role.trim().toUpperCase();
        if (role === "ADMIN") continue;

        const teacherSpecIds = teacher.specialistIds.map((id) =>
          id.toString()
        );
        const specIds = courseSpecIds.map((id) => id.toString());

        const hasMatchingSpecialty = specIds.some((specId) =>
          teacherSpecIds.includes(specId)
        );

        appAssert(
          hasMatchingSpecialty,
          BAD_REQUEST,
          `Teacher "${teacher.username}" does not have the required specialist credentials for this course`
        );
      }
    }
  }

  // Validate specialists if provided
  if (data.specialistIds) {
    const specialists = await SpecialistModel.find({
      _id: { $in: data.specialistIds },
    });

    appAssert(
      specialists.length === data.specialistIds.length,
      BAD_REQUEST,
      "One or more specialists not found"
    );

    const allAreActive = specialists.every((spec) => spec.isActive === true);

    appAssert(
      allAreActive,
      BAD_REQUEST,
      "All specialists must be active"
    );
  }

  // Check if code is unique (if provided and different from current)
  if (data.code && data.code !== course.code) {
    const existingCourse = await CourseModel.findOne({ code: data.code });
    appAssert(
      !existingCourse,
      BAD_REQUEST,
      "Course code already exists"
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

  // Update course
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("teacherIds", "username email fullname avatar_url")
    .populate("specialistIds", "name slug description majorId")
    .populate("createdBy", "username email fullname")
    .lean();

        appAssert(
            teachers.length === data.teachers.length,
            BAD_REQUEST,
            "One or more teachers not found"
        );

        const allAreTeachers = teachers.every(
            (teacher) => {
                const role = teacher.role.trim().toUpperCase();
                return role === "TEACHER" || role === "ADMIN";
            }
        );
        appAssert(
            allAreTeachers,
            BAD_REQUEST,
            "All assigned users must have teacher or admin role"
        );
    }

    // Update course
    const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        {$set: data},
        {new: true}
    )
        .populate("category", "name slug description")
        .populate("teachers", "username email fullname avatar_url")
        .lean();

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
  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, "Course not found or already deleted");

    // Check if user is a teacher of this course or admin
    const user = await UserModel.findById(userId);
    appAssert(user, NOT_FOUND, "User not found");

  const isTeacherOfCourse = course.teacherIds.some(
    (teacherId) => teacherId.toString() === userId
  );
  const normalizedRole = user.role.trim().toUpperCase();
  const isAdmin = normalizedRole === "ADMIN";

    appAssert(
        isAdmin,
        // TODO: Replace this with correct parameters
        // isTeacherOfCourse || isAdmin,
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
  // ✅ Find deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: true,
  });
  appAssert(course, NOT_FOUND, "Deleted course not found");

  // Check if user is admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, "User not found");

  const normalizedRole = user.role.trim().toUpperCase();
  const isAdmin = normalizedRole === "ADMIN";

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
    .populate("specialistIds", "name slug description majorId")
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

  const normalizedRole = user.role.trim().toUpperCase();
  const isAdmin = normalizedRole === "ADMIN";

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
