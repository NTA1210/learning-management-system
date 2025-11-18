import mongoose from "mongoose";
import LessonModel from "../models/lesson.model";
import CourseModel from "../models/course.model";
import EnrollmentModel from "../models/enrollment.model";
import appAssert from "../utils/appAssert";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
  FORBIDDEN,
} from "../constants/http";
import { CreateLessonSchema, LessonQuerySchema } from "@/validators/lesson.schemas";
import { Role } from "../types";

export type CreateLessonParams = {
  title: string;
  courseId: string;
  content?: string;
  order?: number;
  durationMinutes?: number;
  publishedAt?: Date;
};

/**
 * Yêu cầu nghiệp vụ: Tạo mới bài học trong một khóa học.
 * - Không cho phép trùng title trong cùng một course.
 * - ADMIN được phép tạo ở mọi course; TEACHER chỉ được tạo ở course mình dạy.
 * - Trả về bài học kèm thông tin course cơ bản.
 */
export const createLessonService = async (data: CreateLessonParams, userId:mongoose.Types.ObjectId, userRole?: Role) => {
  // Check if lesson with same title exists in the same course
  const existingLesson = await LessonModel.exists({ title: data.title, courseId: data.courseId });
  appAssert(!existingLesson, CONFLICT, "Lesson already exists");

  // Verify the course exists
  const course = await CourseModel.findById(data.courseId);
  appAssert(course, NOT_FOUND, "Course not found");
  
  // ADMIN can create lessons in any course
  // TEACHER can only create lessons in courses they teach
  if (userRole !== Role.ADMIN) {
    const isInstructor = (course as any).teacherIds.includes(new mongoose.Types.ObjectId(userId));
    appAssert(isInstructor, FORBIDDEN, "Only course instructors or admins can create lessons");
  }

  const newLesson = await LessonModel.create(data);
  
  return await LessonModel.findById(newLesson._id)
    .populate('courseId', 'title description')
    .lean();
};

/**
 * Yêu cầu nghiệp vụ: Xóa một bài học.
 * - Chỉ ADMIN hoặc giảng viên của course chứa bài học mới được xóa.
 * - Trả về bản ghi bài học đã xóa.
 */
export const deleteLessonService = async (id: string, userId: mongoose.Types.ObjectId, userRole: Role) => {
  const lesson = await LessonModel.findById(id);
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Get course to check instructor
  const course = await CourseModel.findById(lesson.courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  // Only admin or course instructor can delete
  const isInstructor = (course as any).teacherIds.includes(new mongoose.Types.ObjectId(userId));
  const canDelete = userRole === Role.ADMIN || isInstructor;
  appAssert(canDelete, FORBIDDEN, "Not authorized to delete this lesson");

  const deletedLesson = await LessonModel.findByIdAndDelete(id);
  return deletedLesson;
};

/**
 * Yêu cầu nghiệp vụ: Cập nhật thông tin bài học.
 * - Chỉ ADMIN hoặc giảng viên của course chứa bài học mới được cập nhật.
 * - Không thay đổi logic phân quyền hiện có.
 */
export const updateLessonService = async (id: string, data: Partial<CreateLessonParams>, userId: mongoose.Types.ObjectId, userRole: Role) => {
  const lesson = await LessonModel.findById(id);
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Get course to check instructor
  const course = await CourseModel.findById(lesson.courseId);
  appAssert(course, NOT_FOUND, "Course not found");

  // Only admin or course instructor can update
  const isInstructor = (course as any).teacherIds.includes(new mongoose.Types.ObjectId(userId));
  const canUpdate = userRole === Role.ADMIN || isInstructor;
  appAssert(canUpdate, FORBIDDEN, "Not authorized to update this lesson");

 
  const updatedLesson = await LessonModel.findByIdAndUpdate(id, data, { new: true })
    .populate('courseId', 'title description')
    .lean();
  
  return updatedLesson;
};

/**
 * Yêu cầu nghiệp vụ: Liệt kê danh sách bài học với lọc/tìm kiếm/phan trang.
 * - STUDENT chỉ thấy bài đã publish (publishedAt != null) thuộc các course đã ghi danh hoặc bài đã publish công khai.
 * - TEACHER thấy bài của course mình dạy và cả bài đã publish.
 * - ADMIN thấy tất cả.
 * - Hỗ trợ full-text search theo title, content.
 */
export const getLessons = async (query: any, userId:mongoose.Types.ObjectId , userRole?: Role) => {
  // Validate query parameters using schema
  const { from, to } = query;
 
  const filter: any = {};

  // Basic filters
  if (query.title) {
    filter.title = { $regex: query.title, $options: 'i' }; 
  }
  
  if (query.content) {
    filter.content = { $regex: query.content, $options: 'i' };
  }
  
  if (query.order !== undefined) {
    filter.order = query.order;
  }
  
  if (query.durationMinutes !== undefined) {
    filter.durationMinutes = query.durationMinutes;
  }
  
  if (query.publishedAt) {
    filter.publishedAt = query.publishedAt;
  }

  if (query.courseId) {
    // Khi filter theo courseId, cần validate format và đảm bảo course tồn tại
    appAssert(
      mongoose.Types.ObjectId.isValid(query.courseId),
      NOT_FOUND,
      "Invalid course ID format"
    );

    const course = await CourseModel.findById(query.courseId);
    appAssert(course, NOT_FOUND, "Course not found");

    // Với STUDENT và TEACHER: bắt buộc phải thuộc course này mới được phép tìm kiếm theo courseId
    if (userRole === Role.STUDENT) {
      const enrollment = await EnrollmentModel.findOne({
        studentId: userId,
        courseId: query.courseId,
        status: "approved",
      });
      appAssert(enrollment, FORBIDDEN, "Not enrolled in this course");
    } else if (userRole === Role.TEACHER) {
      const isInstructor = (course as any).teacherIds.includes(
        new mongoose.Types.ObjectId(userId)
      );
      appAssert(isInstructor, FORBIDDEN, "Not instructor of this course");
    }

    filter.courseId = query.courseId;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  // Full-text search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Access control based on user role and publishedAt field
  if (userRole === Role.STUDENT) {
    // Students can only see lessons with publishedAt date (published lessons)
    // and lessons from enrolled courses
    const enrolledCourses = await EnrollmentModel.find({ 
      studentId: userId, 
      status: 'approved' 
    }).select('courseId');
    
    const enrolledCourseIds = enrolledCourses.map(enrollment => enrollment.courseId);
    
    filter.$or = [
      { publishedAt: { $exists: true, $ne: null } }, // Published lessons
      { courseId: { $in: enrolledCourseIds }, publishedAt: { $exists: true, $ne: null } }
    ];
  } else if (userRole === Role.TEACHER) {
    // Teachers can see their own lessons (any publishedAt status) and published lessons
    const teacherCourses = await CourseModel.find({ 
      teacherIds: userId 
    }).select('_id');
    
    const teacherCourseIds = teacherCourses.map(course => course._id);
    
    filter.$or = [
      { courseId: { $in: teacherCourseIds } }, // Own lessons
      { publishedAt: { $exists: true, $ne: null } } // Published lessons
    ];
  }
  // Admin can see everything (no additional filter)

  // DEBUG: Log để kiểm tra
  console.log("=== DEBUG getLessons ===");
  console.log("userRole:", userRole);
  console.log("userId:", userId);
  console.log("filter:", JSON.stringify(filter, null, 2));
  console.log("query:", JSON.stringify(query, null, 2));

  // Pagination
  const page = query.page;
  const limit = query.limit;

  // Get total count first to calculate pagination
  const total = await LessonModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);
  
  // Calculate skip - if page > totalPages, skip will be beyond total, resulting in empty array
  const skip = (page - 1) * limit;

  const lessons = await LessonModel.find(filter)
    .populate('courseId', 'title description isPublished teacherIds') 
    .sort(query.search ? { score: { $meta: 'textScore' } } : { order: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log("Total lessons found:", total);
  console.log("Lessons count:", lessons.length);
  // End DEBUG

  // Add access information for each lesson
  const lessonsWithAccess = await Promise.all(lessons.map(async (lesson) => {
    let hasAccess = false;
    let accessReason = '';

    if (userRole === Role.ADMIN) {
      hasAccess = true;
      accessReason = 'admin';
    } else if (userRole === Role.TEACHER) {
      // Check if teacher is instructor of the course
      const isInstructor = (lesson.courseId as any).teacherIds.includes(new mongoose.Types.ObjectId(userId));
      if (isInstructor) {
        hasAccess = true;
        accessReason = 'instructor';
      } else if (lesson.publishedAt) {
        hasAccess = true;
        accessReason = 'published';
      }
    } else if (userRole === Role.STUDENT) {
      // Check if student is enrolled in the course
      const enrollment = await EnrollmentModel.findOne({
        studentId: userId,
        courseId: lesson.courseId._id,
        status: 'approved'
      });
      
      if (enrollment) {
        hasAccess = true;
        accessReason = 'enrolled';
      } else if (lesson.publishedAt) {
        hasAccess = true;
        accessReason = 'published';
      } else {
        hasAccess = false;
        accessReason = 'not_enrolled';
      }
    }

    return {
      ...lesson,
      hasAccess,
      accessReason
    };
  }));

  // Calculate pagination with correct logic
  const hasNext = page < totalPages;
  const hasPrev = page > 1 && page <= totalPages; // Only true if page is valid and > 1

  return {
    lessons: lessonsWithAccess,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    }
  };
};

/**
 * Yêu cầu nghiệp vụ: Lấy chi tiết một bài học theo id.
 * - Tôn trọng phân quyền như trên; nếu không có quyền thì ẩn content và trả kèm lý do.
 */
export const getLessonById = async (id: string, userId:mongoose.Types.ObjectId, userRole?: Role) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    appAssert(false, NOT_FOUND, "Invalid lesson ID format");
  }
  
  const lesson = await LessonModel.findById(id)
    .populate('courseId', 'title description isPublished teacherIds')
    .lean();
    
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  // Check access permissions
  let hasAccess = false;
  let accessReason = '';

  if (userRole === Role.ADMIN) {
    hasAccess = true;
    accessReason = 'admin';
  } else if (userRole === Role.TEACHER) {
    // Check if teacher is instructor of the course
    const isInstructor = (lesson.courseId as any).teacherIds.includes(new mongoose.Types.ObjectId(userId));
    if (isInstructor) {
      hasAccess = true;
      accessReason = 'instructor';
    } else if (lesson.publishedAt) {
      hasAccess = true;
      accessReason = 'published';
    }
  } else if (userRole === Role.STUDENT) {
    // Check if student is enrolled in the course
    const enrollment = await EnrollmentModel.findOne({
      studentId: userId,
      courseId: lesson.courseId._id,
      status: 'approved'
    });
    
    if (enrollment) {
      hasAccess = true;
      accessReason = 'enrolled';
    } else if (lesson.publishedAt) {
      hasAccess = true;
      accessReason = 'published';
    }
  }

  // If no access, only return basic info
  if (!hasAccess) {
    return {
      ...lesson,
      content: undefined, // Hide content
      hasAccess: false,
      accessReason: 'not_enrolled',
      message: 'You need to enroll in this course to access the lesson content'
    };
  }

  return {
    ...lesson,
    hasAccess: true,
    accessReason
  };
};