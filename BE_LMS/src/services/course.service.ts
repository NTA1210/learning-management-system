import CourseModel from '../models/course.model';
import SpecialistModel from '../models/specialist.model';
import UserModel from '../models/user.model';
import EnrollmentModel from '../models/enrollment.model';
import mongoose, { Types } from 'mongoose';
import SubjectModel from '../models/subject.model';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SemesterModel from '../models/semester.model'; // Required for Mongoose to register the model
import appAssert from '../utils/appAssert';
import { NOT_FOUND, BAD_REQUEST, FORBIDDEN } from '../constants/http';
import { CreateCourseInput, GetQuizzes, UpdateCourseInput } from '../validators/course.schemas';
import { CourseStatus } from '../types/course.type';
import { Role, UserStatus } from '../types/user.type';
import { EnrollmentStatus } from '../types/enrollment.type';
import { uploadFile, removeFile } from '../utils/uploadFile';
import { prefixCourseLogo } from '../utils/filePrefix';
import { AssignmentModel, LessonModel, QuizModel } from '@/models';

import {
  notifyAdminNewCourse,
  notifyTeacherCourseApproved,
  notifyTeacherAssigned,
} from './helpers/notification.helper';

import slugify from 'slugify';

import { snapShotQuestion } from '@/validators/quiz.schemas';
import { AttemptStatus } from '@/types';
import { SubmissionStatus } from '@/types/submission.type';
import { AttendanceStatus } from '@/types/attendance.type';
import { isTeacherOfCourse } from './helpers/quizHelpers';

// ====================================
// HELPER FUNCTIONS FOR LOGO MANAGEMENT
// ====================================

/**
 * Upload course logo to MinIO and return URL + key
 
 */
async function uploadCourseLogo(courseId: string, logoFile: Express.Multer.File) {
  try {
    const logoPrefix = prefixCourseLogo(courseId);
    const { publicUrl, key } = await uploadFile(logoFile, logoPrefix);
    return { publicUrl, key };
  } catch (err) {
    console.error('❌ Logo upload failed:', err);
    // Use appAssert to throw error for middleware to handle
    appAssert(
      false,
      BAD_REQUEST,
      `Failed to upload course logo: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete course logo file from MinIO using key
 
 */
async function deleteCourseLogoFile(key: string) {
  try {
    await removeFile(key);
    console.log(`🗑️ Deleted logo file: ${key}`);
  } catch (err) {
    console.error('⚠️  Failed to delete logo file:', err);
    // Throw error so caller can decide how to handle
    appAssert(
      false,
      BAD_REQUEST,
      `Failed to delete logo file: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

export type ListCoursesParams = {
  page: number;
  limit: number;
  search?: string;
  slug?: string; // Filter by slug (partial match)
  from?: Date; // Date range start for createdAt filtering
  to?: Date; // Date range end for createdAt filtering
  subjectId?: string; // ✅ NEW: Filter by subject instead of specialist
  specialistId?: string; // ✅ NEW: Filter by specialist/specialization
  semesterId?: string; // ✅ NEW: Filter by semester
  teacherId?: string;
  isPublished?: boolean;
  status?: CourseStatus;
  includeDeleted?: boolean; // Admin only - include deleted courses in results
  onlyDeleted?: boolean; // Admin only - show only deleted courses
  sortBy?: string;
  sortOrder?: string;
  userRole?: Role; // ✅ FIX: Added to check permissions for viewing deleted courses
  userId?: Types.ObjectId; // ✅ NEW: User ID for teacher check
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
  slug,
  from,
  to,
  subjectId,
  specialistId,
  semesterId,
  teacherId,
  isPublished,
  status,
  includeDeleted,
  onlyDeleted,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userRole,
  userId,
}: ListCoursesParams) => {
  // ❌ FIX: Validate pagination parameters
  appAssert(page > 0 && page <= 10000, BAD_REQUEST, 'Page must be between 1 and 10000');
  appAssert(limit > 0 && limit <= 100, BAD_REQUEST, 'Limit must be between 1 and 100');

  // ❌ FIX: Validate sortBy field
  const allowedSortFields = [
    'createdAt',
    'updatedAt',
    'title',
    'startDate',
    'endDate',
    'deletedAt',
  ];
  appAssert(
    allowedSortFields.includes(sortBy),
    BAD_REQUEST,
    `Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`
  );

  // ❌ FIX: Validate subjectId/specialistId/teacherId if provided
  if (subjectId) {
    appAssert(subjectId.match(/^[0-9a-fA-F]{24}$/), BAD_REQUEST, 'Invalid subject ID format');
  }
  if (specialistId) {
    appAssert(specialistId.match(/^[0-9a-fA-F]{24}$/), BAD_REQUEST, 'Invalid specialist ID format');
  }
  if (teacherId) {
    appAssert(teacherId.match(/^[0-9a-fA-F]{24}$/), BAD_REQUEST, 'Invalid teacher ID format');
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

  // ✅ VISIBILITY CONTROL: Enforce strict rules for non-admins
  if (userRole !== Role.ADMIN) {
    // Non-admins (Student/Teacher) can ONLY see:
    // 1. ONGOING courses
    // 2. PUBLISHED courses
    filter.status = CourseStatus.ONGOING;
    filter.isPublished = true;
  } else {
    // Admin logic remains flexible
    if (isPublished !== undefined) {
      filter.isPublished = isPublished;
    }
    if (status) {
      filter.status = status;
    }
  }

  // Status filter is handled above for non-admins
  // For admins, it's handled in the else block above

  // ✅ NEW: Filter by subject ID
  if (subjectId) {
    filter.subjectId = subjectId;
  }

  // ✅ NEW: Filter by specialist ID (through subject's specialistIds)
  if (specialistId) {


    // Find all subjects that have this specialist
    const subjectsWithSpecialist = await SubjectModel.find({
      specialistIds: specialistId,
    }).select('_id name specialistIds');


    const subjectIds = subjectsWithSpecialist.map((s) => s._id);


    if (subjectIds.length > 0) {
      filter.subjectId = { $in: subjectIds };

    } else {
      // No subjects found with this specialist, return empty result
      filter.subjectId = null; // This will match no courses

    }
  }

  // ✅ NEW: Filter by semester ID
  if (semesterId) {
    filter.semesterId = semesterId;
  }

  // ✅ HIDE EXPIRED COURSES: Non-admins should not see courses from past semesters in public list
  if (!isAdmin) {
    const now = new Date();
    const expiredSemesters = await SemesterModel.find({ endDate: { $lt: now } }).select('_id');
    const expiredSemesterIds = expiredSemesters.map((s) => s._id);

    if (expiredSemesterIds.length > 0) {
      if (filter.semesterId) {
        // If specific semester requested, ensure it's not expired
        filter.semesterId = { $eq: filter.semesterId, $nin: expiredSemesterIds };
      } else {
        // Exclude all expired semesters
        filter.semesterId = { $nin: expiredSemesterIds };
      }
    }
  }

  // Filter by teacher ID
  if (teacherId) {
    filter.teacherIds = teacherId;
  }

  // ✅ Filter by date range (validation handled by schema)
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  // Filter by slug (partial match)
  if (slug) {
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.slug = { $regex: escapedSlug, $options: 'i' };
  }

  // Search by title or description (text search)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // ✅ DEBUG: Log final filter before query


  // Execute query with pagination
  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .populate('teacherIds', 'username email fullname avatar_url')
      .populate({
        path: 'subjectId',
        select: 'name code slug description credits specialistIds',
        populate: {
          path: 'specialistIds',
          select: 'name code description',
        },
      })
      .populate('semesterId', 'name year type startDate endDate')
      .populate('createdBy', 'username email fullname')
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

  // ✅ Add isTeacher field to each course for teacher role
  const coursesWithTeacherFlag = courses.map((course) => {
    const isTeacherOfCourse = userId
      ? course.teacherIds.some(
        (teacherId: any) =>
          teacherId._id?.toString() === userId.toString() ||
          teacherId.toString() === userId.toString()
      )
      : false;

    return {
      ...course,
      isTeacherOfCourse,
    };
  });

  return {
    courses: coursesWithTeacherFlag,
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
export const getCourseById = async (courseId: string, userId?: Types.ObjectId) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    'Invalid course ID format'
  );

  // ✅ SOFT DELETE: Only get non-deleted course
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  })
    .populate('teacherIds', 'username email fullname avatar_url bio')
    .populate('subjectId', 'name code slug description credits')
    .populate('semesterId', 'name year type startDate endDate')
    .populate('createdBy', 'username email fullname')
    .lean();

  appAssert(course, NOT_FOUND, 'Course not found');

  // ✅ Add isTeacherOfCourse field
  const isTeacherOfCourse = userId
    ? (course.teacherIds as any[]).some(
      (teacherId: any) =>
        teacherId._id?.toString() === userId.toString() ||
        teacherId.toString() === userId.toString()
    )
    : false;

  return {
    ...course,
    isTeacherOfCourse,
  };
};

/**
 * Lấy thông tin chi tiết một khóa học theo Slug
 * Hỗ trợ partial match: tìm "444" sẽ match với "444-rede44velopment-test-flug"
 */
export const getCourseBySlug = async (slug: string) => {
  appAssert(slug, BAD_REQUEST, 'Slug is required');

  // Escape special regex characters để tránh lỗi
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ✅ SOFT DELETE: Only get non-deleted course
  // Sử dụng regex để tìm kiếm partial match (case-insensitive)
  const course = await CourseModel.findOne({
    slug: { $regex: escapedSlug, $options: 'i' },
    isDeleted: false,
  })
    .populate('teacherIds', 'username email fullname avatar_url bio')
    .populate('subjectId', 'name code slug description credits')
    .populate('semesterId', 'name year type startDate endDate')
    .populate('createdBy', 'username email fullname')
    .lean();

  appAssert(course, NOT_FOUND, 'Course not found');

  return course;
};

/**
 * Tạo khóa học mới
 */
export const createCourse = async (
  data: CreateCourseInput,
  userId: Types.ObjectId,
  logoFile?: Express.Multer.File
) => {
  // ❌ FIX: Validate teacherIds array
  appAssert(
    data.teacherIds && data.teacherIds.length > 0,
    BAD_REQUEST,
    'At least one teacher is required'
  );

  // ❌ FIX: Check duplicate teacherIds
  const uniqueTeachers = new Set(data.teacherIds.map((id) => id.toString()));
  appAssert(
    uniqueTeachers.size === data.teacherIds.length,
    BAD_REQUEST,
    'Teacher list contains duplicate entries'
  );

  // ❌ FIX: Check for duplicate course title
  const existingCourse = await CourseModel.findOne({
    title: data.title,
    isDeleted: false,
  });
  appAssert(!existingCourse, BAD_REQUEST, 'A course with this title already exists');

  // Validate dates
  appAssert(data.startDate, BAD_REQUEST, 'Start date is required');
  appAssert(data.endDate, BAD_REQUEST, 'End date is required');

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  appAssert(endDate > startDate, BAD_REQUEST, 'End date must be after start date');

  // ✅ UNIVERSITY RULE: Validate subject exists
  const subject = await SubjectModel.findById(data.subjectId);
  appAssert(subject, NOT_FOUND, 'Subject not found');
  appAssert(subject.isActive, BAD_REQUEST, 'Cannot create course for inactive subject');

  // ✅ UNIVERSITY RULE: Validate capacity is reasonable
  if (data.capacity !== undefined) {
    appAssert(
      data.capacity > 0 && data.capacity <= 500,
      BAD_REQUEST,
      'Capacity must be between 1 and 500 students'
    );
  }

  // Validate all teachers exist and have correct roles
  const teachers = await UserModel.find({
    _id: { $in: data.teacherIds },
  });

  appAssert(
    teachers.length === data.teacherIds.length,
    BAD_REQUEST,
    'One or more teachers not found'
  );

  // Check if all users have teacher or admin role
  const allAreTeachers = teachers.every((teacher) => {
    return teacher.role === Role.TEACHER || teacher.role === Role.ADMIN;
  });

  appAssert(allAreTeachers, BAD_REQUEST, 'All assigned users must have teacher or admin role');

  // ❌ FIX: Check if teachers are active (not banned/inactive)
  const allTeachersActive = teachers.every((teacher) => {
    return teacher.status === UserStatus.ACTIVE;
  });

  appAssert(allTeachersActive, BAD_REQUEST, 'Cannot assign inactive or banned teachers to course');

  // ✅ UNIVERSITY RULE: Validate teacher specialization matches subject
  // Only teachers with matching specialist can teach the course
  const subjectSpecialistIds = subject.specialistIds?.map((id) => id.toString()) || [];

  if (subjectSpecialistIds.length > 0) {
    // Check each teacher has at least one matching specialist
    const invalidTeachers: string[] = [];

    for (const teacher of teachers) {
      const teacherSpecialistIds = teacher.specialistIds?.map((id: any) => id.toString()) || [];

      // Admin can bypass specialist check -> REMOVED: Admin must also have specialization
      // if (teacher.role === Role.ADMIN) {
      //   continue;
      // }

      // Check if teacher has at least one matching specialist
      const hasMatchingSpecialist = teacherSpecialistIds.some((teacherSpecId: string) =>
        subjectSpecialistIds.includes(teacherSpecId)
      );

      if (!hasMatchingSpecialist) {
        invalidTeachers.push((teacher.fullname || teacher.username) as string);
      }
    }

    appAssert(
      invalidTeachers.length === 0,
      BAD_REQUEST,
      `The following teachers do not have the required specialization for this subject: ${invalidTeachers.join(
        ', '
      )}`
    );
  }

  // ✅ YÊU CẦU 2: Teacher tạo course cần Admin approve
  // Get creator info to determine permissions
  const creator = await UserModel.findById(userId);
  appAssert(creator, BAD_REQUEST, 'Creator user not found');

  const isAdmin = creator.role === Role.ADMIN;

  // ✅ PERMISSION RULE: Teacher can ONLY assign themselves
  if (!isAdmin) {
    const isOnlyAddingSelf =
      data.teacherIds.length === 1 && data.teacherIds[0].toString() === userId.toString();

    appAssert(
      isOnlyAddingSelf,
      FORBIDDEN,
      'Teachers can only assign themselves when creating a course. ' +
      'To add co-teachers, please use the course invitation system or contact an administrator.'
    );
  }
  // Admin có full control - can assign any teachers

  // Determine final status and publish state
  let finalIsPublished = data.isPublished || false;
  let finalStatus = data.status || CourseStatus.DRAFT;

  if (!isAdmin) {
    // ✅ TEACHER RULE: Teacher CANNOT publish course immediately - cần admin approve
    // Force isPublished = false AND status = DRAFT regardless of input
    finalIsPublished = false;
    finalStatus = CourseStatus.DRAFT;
  } else {
    // ✅ AUTO PUBLISH: Admin tạo course thì luôn publish
    finalIsPublished = true;

    if (finalStatus === CourseStatus.DRAFT) {
      finalStatus = CourseStatus.ONGOING;
    }
  }

  // Validate provided semesterId
  const semester = await SemesterModel.findById(data.semesterId);
  appAssert(semester, BAD_REQUEST, 'Invalid semester ID');

  // Generate slug from title
  let slug = slugify(data.title, {
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  });

  // Check for duplicate slug and make it unique if needed
  const existingSlug = await CourseModel.findOne({ slug, isDeleted: false });
  if (existingSlug) {
    // Append timestamp to make it unique
    slug = `${slug}-${Date.now().toString().slice(-6)}`;
  }

  // Create course with createdBy
  const courseData = {
    ...data,
    slug,
    startDate,
    endDate,
    status: finalStatus,
    isPublished: finalIsPublished,
    createdBy: userId,
  };

  const course = await CourseModel.create(courseData);

  // ❌ FIX: Ensure course was created
  appAssert(course, BAD_REQUEST, 'Failed to create course');

  // 🖼️ Upload logo if provided
  if (logoFile) {
    let uploadedKey: string | null = null;

    try {
      const courseId = String(course._id);
      const { publicUrl, key } = await uploadCourseLogo(courseId, logoFile);
      uploadedKey = key; // Track uploaded key for cleanup if needed

      // Update course with logo URL and key
      await CourseModel.findByIdAndUpdate(courseId, { logo: publicUrl, key });
      course.logo = publicUrl;
    } catch (err) {
      // ❌ Rollback: Clean up uploaded logo (if any) and delete course
      if (uploadedKey) {
        await deleteCourseLogoFile(uploadedKey).catch((cleanupErr) =>
          console.error('Failed to cleanup uploaded logo:', cleanupErr)
        );
      }
      await CourseModel.findByIdAndDelete(course._id);
      console.error('❌ Logo upload/update failed, course creation rolled back:', err);
      // Re-throw error for middleware to handle
      throw err;
    }
  }

  // Populate and return
  const populatedCourse = await CourseModel.findById(String(course._id))
    .populate('teacherIds', 'username email fullname avatar_url')
    .populate('subjectId', 'name code slug description credits')
    .populate('semesterId', 'name year type startDate endDate')
    .populate('createdBy', 'username email fullname')
    .lean();

  // ❌ FIX: Ensure populated course exists
  appAssert(populatedCourse, BAD_REQUEST, 'Failed to retrieve created course');

  // 🔔 NOTIFICATIONS
  const warnings: string[] = [];
  try {
    const courseIdStr = String(course._id);

    // 1. Notify Admin if Teacher created the course
    if (!isAdmin) {
      const teacherName = creator.fullname || creator.username || 'Unknown Teacher';
      await notifyAdminNewCourse(courseIdStr, data.title, teacherName);
    }

    // 2. Notify assigned teachers (excluding the creator if they assigned themselves)
    const assignedTeacherIds = data.teacherIds
      .map((id) => id.toString())
      .filter((id) => id !== userId.toString());

    if (assignedTeacherIds.length > 0) {
      await notifyTeacherAssigned(courseIdStr, data.title, assignedTeacherIds);
    }
  } catch (error) {
    console.error('Failed to send notifications for createCourse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    warnings.push(`Failed to send notifications: ${errorMessage}`);
    // Don't fail the request if notification fails
  }

  return {
    course: populatedCourse,
    warnings,
  };
};

/**
 * Cập nhật khóa học
 */
export const updateCourse = async (
  courseId: string,
  data: UpdateCourseInput,
  userId: Types.ObjectId,
  logoFile?: Express.Multer.File
) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    'Invalid course ID format'
  );

  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, 'Course not found');

  // ✅ UPDATED: Allow updating COMPLETED courses
  // Teachers may need to update grades, course info, or statistics after course completion

  // Check if user is a teacher of this course or admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'User not found');

  const isTeacherOfCourse = course.teacherIds.some((teacherId) => teacherId.equals(userId));

  const isAdmin = user.role === Role.ADMIN;

  appAssert(
    isTeacherOfCourse || isAdmin,
    FORBIDDEN,
    "You don't have permission to update this course"
  );

  // ❌ FIX: Check for duplicate course title if title is being updated
  if (data.title && data.title !== course.title) {
    const existingCourse = await CourseModel.findOne({
      title: data.title,
      isDeleted: false,
      _id: { $ne: courseId }, // Exclude current course
    });
    appAssert(!existingCourse, BAD_REQUEST, 'A course with this title already exists');

    // Regenerate slug when title changes
    let newSlug = slugify(data.title, {
      lower: true,
      strict: true,
      locale: 'vi',
      trim: true,
    });

    // Check for duplicate slug
    const existingSlug = await CourseModel.findOne({
      slug: newSlug,
      isDeleted: false,
      _id: { $ne: courseId },
    });

    if (existingSlug) {
      newSlug = `${newSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Add slug to update data
    (data as any).slug = newSlug;
  }

  // Validate dates if provided
  if (data.startDate || data.endDate) {
    const startDate = data.startDate ? new Date(data.startDate) : course.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : course.endDate;

    appAssert(endDate > startDate, BAD_REQUEST, 'End date must be after start date');

    // ❌ FIX: Cannot change startDate if course already started
    if (data.startDate) {
      const now = new Date();
      appAssert(
        course.startDate > now,
        BAD_REQUEST,
        'Cannot change start date of a course that has already started'
      );
      // Also validate new startDate is in the future
      appAssert(startDate > now, BAD_REQUEST, 'New start date must be in the future');
      data.startDate = startDate as any;
    }

    if (data.endDate) data.endDate = endDate as any;
  }

  // Validate teachers if provided OR if subject is changing
  if (data.teacherIds || data.subjectId) {
    let teachers: any[] = [];

    // If teachers are being updated, perform full validation on new teachers
    if (data.teacherIds) {
      // ❌ FIX: Check duplicate teacherIds
      const uniqueTeachers = new Set(data.teacherIds.map((id) => id.toString()));
      appAssert(
        uniqueTeachers.size === data.teacherIds.length,
        BAD_REQUEST,
        'Teacher list contains duplicate entries'
      );

      teachers = await UserModel.find({
        _id: { $in: data.teacherIds },
      });

      appAssert(
        teachers.length === data.teacherIds.length,
        BAD_REQUEST,
        'One or more teachers not found'
      );

      const allAreTeachers = teachers.every((teacher) => {
        return teacher.role === Role.TEACHER || teacher.role === Role.ADMIN;
      });

      appAssert(allAreTeachers, BAD_REQUEST, 'All assigned users must have teacher or admin role');

      // ❌ FIX: Check if teachers are active (not banned/inactive)
      const allTeachersActive = teachers.every((teacher) => {
        return teacher.status === UserStatus.ACTIVE;
      });

      appAssert(
        allTeachersActive,
        BAD_REQUEST,
        'Cannot assign inactive or banned teachers to course'
      );
    } else {
      // If only subject is changing, we need to validate EXISTING teachers against NEW subject
      teachers = await UserModel.find({
        _id: { $in: course.teacherIds },
      });
    }

    // ✅ UNIVERSITY RULE: Validate teacher specialization matches subject
    // Get effective subject (new one or existing one)
    const subjectIdToCheck = data.subjectId || course.subjectId;
    const courseSubject = await SubjectModel.findById(subjectIdToCheck);
    appAssert(courseSubject, NOT_FOUND, 'Course subject not found');

    const subjectSpecialistIds = courseSubject.specialistIds?.map((id) => id.toString()) || [];

    if (subjectSpecialistIds.length > 0) {
      // Check each teacher has at least one matching specialist
      const invalidTeachers: string[] = [];

      for (const teacher of teachers) {
        const teacherSpecialistIds = teacher.specialistIds?.map((id: any) => id.toString()) || [];

        // Admin can bypass specialist check -> REMOVED: Admin must also have specialization
        // if (teacher.role === Role.ADMIN) {
        //   continue;
        // }

        // Check if teacher has at least one matching specialist
        const hasMatchingSpecialist = teacherSpecialistIds.some((teacherSpecId: string) =>
          subjectSpecialistIds.includes(teacherSpecId)
        );

        if (!hasMatchingSpecialist) {
          invalidTeachers.push((teacher.fullname || teacher.username) as string);
        }
      }

      appAssert(
        invalidTeachers.length === 0,
        BAD_REQUEST,
        `The following teachers do not have the required specialization for this subject: ${invalidTeachers.join(
          ', '
        )}`
      );
    }
  }

  // ✅ TEACHER RESTRICTION: Only Admin can approve/publish courses
  // Teacher CANNOT change isPublished OR status fields
  // Prepare update data
  const updateData: any = { ...data };

  if (!isAdmin) {
    // ✅ FIX: Teacher CANNOT change isPublished field at all
    // - Cannot publish (set true)
    // - Cannot unpublish (set false) if already published by admin
    if (data.isPublished !== undefined) {
      delete updateData.isPublished;
      // Note: Only admin can control publish status
    }

    // ✅ TEACHER STATUS RULES: Limited status transitions
    if (data.status !== undefined) {
      const currentStatus = course.status;
      const newStatus = data.status;

      // Teacher CAN ONLY: ONGOING → COMPLETED (mark course as finished)
      const isAllowedTransition =
        currentStatus === CourseStatus.ONGOING && newStatus === CourseStatus.COMPLETED;

      if (!isAllowedTransition) {
        // Block all other transitions:
        // - DRAFT → ONGOING (only admin can approve)
        // - COMPLETED → ONGOING (cannot rollback)
        // - COMPLETED → DRAFT (cannot rollback)
        // - Any other invalid transition
        delete updateData.status;
        // Note: Teacher can only complete ONGOING courses
      }
    }
  }

  // ✅ AUTO STATUS: When admin approves (publishes) a DRAFT course, auto change to ONGOING
  if (isAdmin && data.isPublished === true && course.status === CourseStatus.DRAFT) {
    updateData.status = CourseStatus.ONGOING;
  }

  // ====================================
  // 🖼️ HANDLE LOGO OPERATIONS
  // ====================================

  const shouldRemoveLogo = data.logo === null || data.logo === '';
  const shouldUploadNewLogo = logoFile !== undefined;

  if (shouldRemoveLogo) {
    // User wants to remove logo
    if (course.key) {
      await deleteCourseLogoFile(course.key);
    }

    // Remove logo field from updateData to avoid MongoDB conflict
    delete updateData.logo;

    // Remove both logo and key from database
    updateData.$unset = { logo: 1, key: 1 };
  } else if (shouldUploadNewLogo) {
    // User wants to upload new logo
    // ⚠️ Important: Upload new logo FIRST before updating DB
    // This ensures atomicity - if upload fails, nothing changes
    const oldKey = course.key;

    // Upload new logo first
    const { publicUrl, key } = await uploadCourseLogo(courseId, logoFile);
    updateData.logo = publicUrl;
    updateData.key = key;

    // Note: Old logo will be deleted ONLY after successful DB update
    // This is handled below after the DB update succeeds

    // Store oldKey for cleanup after successful DB update
    updateData._oldLogoKey = oldKey;
  }

  // ====================================
  // 📝 BUILD MONGODB UPDATE QUERY
  // ====================================
  // MongoDB requires separate $set and $unset operators
  // Cannot use both in the same object at root level

  // Extract temporary fields that shouldn't go to DB
  const oldLogoKey = updateData._oldLogoKey;
  delete updateData._oldLogoKey;

  const updateQuery: any = {};

  // Add $unset operations (remove fields)
  if (updateData.$unset) {
    updateQuery.$unset = updateData.$unset;
    delete updateData.$unset; // Remove from updateData to avoid duplication
  }

  // Add $set operations (update fields)
  if (Object.keys(updateData).length > 0) {
    updateQuery.$set = updateData;
  }

  // ====================================
  // 💾 UPDATE DATABASE WITH ROLLBACK
  // ====================================
  // Store new logo key for rollback if DB update fails
  const newLogoKey = updateData.key;

  let updatedCourse;
  try {
    updatedCourse = await CourseModel.findByIdAndUpdate(courseId, updateQuery, {
      new: true,
      runValidators: true,
    })
      .populate('teacherIds', 'username email fullname avatar_url')
      .populate('subjectId', 'name code slug description credits')
      .populate('semesterId', 'name year type startDate endDate')
      .populate('createdBy', 'username email fullname')
      .lean();

    // ❌ FIX: Ensure course was updated successfully
    appAssert(updatedCourse, BAD_REQUEST, 'Failed to update course');

    // ✅ DB update successful - now safe to delete old logo if exists
    if (oldLogoKey) {
      await deleteCourseLogoFile(oldLogoKey).catch((err) =>
        console.error('⚠️  Failed to delete old logo (non-critical):', err)
      );
    }
  } catch (err) {
    // ❌ DB update failed - rollback new logo if it was uploaded
    if (newLogoKey) {
      await deleteCourseLogoFile(newLogoKey).catch((cleanupErr) =>
        console.error('Failed to cleanup new logo:', cleanupErr)
      );
    }
    console.error('❌ Failed to update course:', err);
    throw err; // Re-throw to let error handler handle it
  }

  // 🔔 NOTIFICATIONS
  const warnings: string[] = [];
  try {
    const courseIdStr = courseId.toString();

    // 1. Notify Teacher if Admin approved the course
    // Check if status changed from DRAFT to ONGOING (or isPublished changed from false to true)
    // Note: We use the *original* course state vs the *updateData* intent
    if (isAdmin && !course.isPublished && updateData.isPublished === true) {
      // Notify all teachers of this course
      const teacherIds = updatedCourse.teacherIds.map((t: any) => t._id.toString());
      // Or just the creator? Usually the teachers assigned should know.
      // Let's notify the creator if they are a teacher, OR all assigned teachers.
      // Requirement says "Notify Teacher (owner)".
      // Let's notify all assigned teachers as they are "owners" of the class content.
      for (const tid of teacherIds) {
        await notifyTeacherCourseApproved(courseIdStr, updatedCourse.title, tid);
      }
    }

    // 2. Notify newly assigned teachers
    if (data.teacherIds) {
      const oldTeacherIds = course.teacherIds.map((id) => id.toString());
      const newTeacherIds = data.teacherIds.map((id) => id.toString());

      // Find IDs that are in new list but NOT in old list
      const addedTeacherIds = newTeacherIds.filter((id) => !oldTeacherIds.includes(id));

      if (addedTeacherIds.length > 0) {
        await notifyTeacherAssigned(courseIdStr, updatedCourse.title, addedTeacherIds);
      }
    }
  } catch (error) {
    console.error('Failed to send notifications for updateCourse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    warnings.push(`Failed to send notifications: ${errorMessage}`);
  }

  return {
    course: updatedCourse,
    warnings,
  };
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
    'Invalid course ID format'
  );

  // ✅ SOFT DELETE: Find non-deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  });
  appAssert(course, NOT_FOUND, 'Course not found or already deleted');

  // ❌ FIX: Cannot delete ongoing course
  appAssert(
    course.status !== CourseStatus.ONGOING,
    BAD_REQUEST,
    'Cannot delete an ongoing course. Please complete or cancel it first.'
  );

  // ✅ UNIVERSITY BUSINESS RULE: Check for active enrollments
  const activeEnrollmentCount = await EnrollmentModel.countDocuments({
    courseId,
    status: { $in: ['pending', 'approved'] }, // Active enrollments
  });

  appAssert(
    activeEnrollmentCount === 0,
    BAD_REQUEST,
    `Cannot delete course with ${activeEnrollmentCount} active enrollment(s). Please cancel or complete all enrollments first.`
  );

  // Check if user is a teacher of this course or admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'User not found');

  const isTeacherOfCourse = course.teacherIds.some((teacherId) => teacherId.equals(userId));
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
    message: 'Course deleted successfully',
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
    'Invalid course ID format'
  );

  // ✅ Find deleted course only
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: true,
  });
  appAssert(course, NOT_FOUND, 'Deleted course not found');

  // Check if user is admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'User not found');

  const isAdmin = user.role === Role.ADMIN;

  appAssert(isAdmin, FORBIDDEN, 'Only administrators can restore deleted courses');

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
    .populate('teacherIds', 'username email fullname avatar_url')
    .populate('subjectId', 'name code slug description credits')
    .populate('createdBy', 'username email fullname')
    .lean();

  return {
    message: 'Course restored successfully',
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
export const permanentDeleteCourse = async (courseId: string, userId: string) => {
  // ❌ FIX: Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    'Invalid course ID format'
  );

  // ✅ Find deleted course only (must be soft-deleted first)
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: true, // IMPORTANT: Chỉ xóa được courses đã soft delete
  });
  appAssert(
    course,
    NOT_FOUND,
    'Course not found in recycle bin. Only deleted courses can be permanently deleted.'
  );

  // ✅ Check if user is admin
  const user = await UserModel.findById(userId);
  appAssert(user, NOT_FOUND, 'User not found');

  const isAdmin = user.role === Role.ADMIN;

  appAssert(isAdmin, FORBIDDEN, 'Only administrators can permanently delete courses');

  // ⚠️ Check if course has related data
  // Prevent deletion of courses with enrollments
  const enrollmentCount = await EnrollmentModel.countDocuments({ courseId });
  appAssert(
    enrollmentCount === 0,
    BAD_REQUEST,
    `Cannot permanently delete course with ${enrollmentCount} enrollment(s). Please remove enrollments first.`
  );

  // 🗑️ Delete logo file from MinIO (if exists)
  if (course.key) {
    await deleteCourseLogoFile(course.key).catch((err) => {
      console.error('⚠️  Failed to delete logo file (non-critical):', err);
      // Continue with course deletion even if logo deletion fails
    });
  }

  // ✅ HARD DELETE: Remove from database permanently
  await CourseModel.findByIdAndDelete(courseId);

  return {
    message: 'Course permanently deleted successfully',
    warning: 'This action cannot be undone',
    deletedCourseId: courseId,
  };
};

/**
 * Lấy danh sách khóa học của tôi (My Courses)
 * - Student: Các khóa học đã enroll
 * - Teacher: Các khóa học đã tạo hoặc được phân công dạy
 * - Admin: Tất cả khóa học
 */
export const getMyCourses = async ({
  userId,
  userRole,
  params,
}: {
  userId: string;
  userRole: Role;
  params: ListCoursesParams;
}) => {
  const {
    page,
    limit,
    search,
    slug,
    subjectId,
    specialistId,
    semesterId,
    isPublished,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  // Validate pagination
  appAssert(page > 0, BAD_REQUEST, 'Page must be greater than 0');
  appAssert(limit > 0 && limit <= 100, BAD_REQUEST, 'Limit must be between 1 and 100');

  const filter: any = { isDeleted: false };

  // 1. Role-based filtering
  if (userRole === Role.STUDENT) {
    // Student: Find enrolled courses
    const enrollments = await EnrollmentModel.find({
      studentId: userId,
      // A completed course remains visible to its student for review.
      status: { $in: [EnrollmentStatus.APPROVED, EnrollmentStatus.COMPLETED] },
    }).select('courseId');

    const courseIds = enrollments.map((e) => e.courseId);
    filter._id = { $in: courseIds };
  } else if (userRole === Role.TEACHER) {
    // Teacher: Created by me OR Assigned to me
    filter.$or = [{ createdBy: userId }, { teacherIds: userId }];
  } else if (userRole === Role.ADMIN) {
    // Admin: See all (no extra filter needed on _id/owner)
  }

  // 2. Common filters (Search, Subject, Specialist, Semester, Status, Published)
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  // Filter by slug (partial match)
  if (slug) {
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.slug = { $regex: escapedSlug, $options: 'i' };
  }

  if (subjectId) filter.subjectId = subjectId;

  // Filter by specialist ID (through subject's specialistIds)
  if (specialistId) {


    // Find all subjects that have this specialist
    const subjectsWithSpecialist = await SubjectModel.find({
      specialistIds: specialistId,
    }).select('_id name specialistIds');

    const subjectIds = subjectsWithSpecialist.map((s) => s._id);

    if (subjectIds.length > 0) {
      filter.subjectId = { $in: subjectIds };
    } else {
      // No subjects found with this specialist, return empty result
      filter.subjectId = null; // This will match no courses

    }
  }

  if (semesterId) filter.semesterId = semesterId;

  // Allow filtering by status/published for My Courses (even for students/teachers)
  // because "My Courses" is a personal view, seeing Drafts/Pending is expected for Teachers
  if (status) filter.status = status;
  if (isPublished !== undefined) filter.isPublished = isPublished;

  // 3. Pagination & Sort
  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // 4. Execute Query
  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .populate('teacherIds', 'username email fullname avatar_url')
      .populate({
        path: 'subjectId',
        select: 'name code slug description credits specialistIds',
        populate: {
          path: 'specialistIds',
          select: 'name code description',
        },
      })
      .populate('semesterId', 'name year type startDate endDate')
      .populate('createdBy', 'username email fullname')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseModel.countDocuments(filter),
  ]);

  // 5. Pagination Metadata
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
 * Get quizzes based on the provided parameters.
 * @param input - Parameters to get quizzes.
 * @param role - Role of the user.
 * @param userId - ID of the user, required for students.
 * @returns A list of quizzes filtered based on the provided parameters.
 * @throws If the course is not found.
 * @throws If the user is not a teacher of the course.
 * @throws If courseId is not provided for students.
 */
export const getQuizzes = async (
  { courseId, isPublished, isCompleted, page = 1, limit = 10, search }: GetQuizzes,
  role: string
) => {
  const filter: any = {};

  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');
  filter.courseId = courseId;

  if (role === Role.STUDENT) {
    filter.isPublished = true;
  } else {
    if (isPublished !== undefined) filter.isPublished = isPublished;
    if (isCompleted !== undefined) {
      if (isCompleted) filter.endTime = { $gte: new Date() };
      else filter.endTime = { $lt: new Date() };
    }
  }

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
    filter.description = { $regex: search, $options: 'i' };
  }

  let [quizzes, total] = await Promise.all([
    QuizModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    QuizModel.countDocuments(filter),
  ]);

  if (role === Role.STUDENT) {
    quizzes = quizzes.map((quiz) => {
      delete quiz.hashPassword;
      return { ...quiz, snapshotQuestions: [] };
    });
  }

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    quizzes,
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
 * Hoàn thành khóa học
 * - Tính tổng số học viên, lessons, quizzes, assignments cho course
 * - Cập nhật progress, finalGrade & status cho tất cả học viên
 * - Tính điểm trung bình theo progress
 * - Kiểm tra điều kiện DROPPED
 * - Cập nhật tất cả học viên cùng lúc
 * - Cập nhật status của course
 * @param courseId - ID của khóa học
 * @returns Khoa học hoàn thành
 */

export const completeCourse = async (
  courseId: string,
  userId: mongoose.Types.ObjectId,
  role: Role
) => {
  // 1. Load course (lean for plain object)
  const course = await CourseModel.findById(courseId).populate([
    { path: 'semesterId', select: 'name year type' },
    { path: 'teacherIds', select: 'username fullname avatar_url' },
  ]);
  appAssert(course, NOT_FOUND, 'Course not found');

  if (role === Role.TEACHER) {
    appAssert(isTeacherOfCourse(course, userId), FORBIDDEN, 'You are not a teacher of this course');
  }

  // If already completed, error
  // appAssert(course.status !== CourseStatus.COMPLETED, BAD_REQUEST, 'Course is completed');

  // 2. Aggregate per-enrollment stats (your existing pipeline, slightly cleaned)
  const stats = await EnrollmentModel.aggregate([
    {
      $match: {
        courseId: course._id,
        role: Role.STUDENT,
        status: {
          $in: [EnrollmentStatus.APPROVED, EnrollmentStatus.DROPPED, EnrollmentStatus.COMPLETED],
        },
      },
    },

    // student info
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              password: 0,
              email: 0,
              phone: 0,
              address: 0,
              role: 0,
              createdAt: 0,
              updatedAt: 0,
              isVerified: 0,
              __v: 0,
            },
          },
        ],
        as: 'student',
      },
    },
    { $set: { student: { $arrayElemAt: ['$student', 0] } } },

    // attendance
    {
      $lookup: {
        from: 'attendances',
        let: { sid: '$studentId', cid: '$courseId' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$studentId', '$$sid'] }, { $eq: ['$courseId', '$$cid'] }] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', AttendanceStatus.PRESENT] }, 1, 0] } },
              absent: { $sum: { $cond: [{ $eq: ['$status', AttendanceStatus.ABSENT] }, 1, 0] } },
            },
          },
        ],
        as: 'attendanceStats',
      },
    },
    {
      $set: {
        attendance: {
          total: { $ifNull: [{ $arrayElemAt: ['$attendanceStats.total', 0] }, 0] },
          present: { $ifNull: [{ $arrayElemAt: ['$attendanceStats.present', 0] }, 0] },
          absent: { $ifNull: [{ $arrayElemAt: ['$attendanceStats.absent', 0] }, 0] },
        },
      },
    },

    /** -----------------------------------------
     * QUIZ LIST
     * -----------------------------------------*/
    {
      $lookup: {
        from: 'quizzes',
        localField: 'courseId',
        foreignField: 'courseId',
        as: 'quizzes',
      },
    },

    /** -----------------------------------------
     * QUIZ ATTEMPTS RAW (không group)
     * -----------------------------------------*/
    {
      $lookup: {
        from: 'quizAttempts',
        let: { quizIds: '$quizzes._id', sid: '$studentId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$studentId', '$$sid'] }, { $in: ['$quizId', '$$quizIds'] }],
              },
            },
          },
          // Keep every valid submission state. A graded submission must be
          // included in the final score instead of being discarded after the
          // teacher changes its status from "submitted" to "graded".
          {
            $match: {
              status: {
                $in: [
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.RESUBMITTED,
                  SubmissionStatus.OVERDUE,
                  SubmissionStatus.GRADED,
                ],
              },
            },
          },
        ],
        as: 'quizAttemptsRaw',
      },
    },

    /** -----------------------------------------
     * QUIZ STATS: attempts count + totalScore
     * -----------------------------------------*/
    {
      $addFields: {
        quizStats: [
          {
            attempts: { $size: '$quizAttemptsRaw' },
            totalScore: { $sum: '$quizAttemptsRaw.score' },
          },
        ],
      },
    },

    /** -----------------------------------------
     * QUIZ DETAILS (1 record / 1 quiz)
     * -----------------------------------------*/
    {
      $addFields: {
        quizDetails: {
          $map: {
            input: '$quizzes',
            as: 'q',
            in: {
              quizId: '$$q._id',
              title: '$$q.title',

              score: {
                $let: {
                  vars: {
                    att: {
                      $first: {
                        $filter: {
                          input: '$quizAttemptsRaw',
                          as: 'a',
                          cond: { $eq: ['$$a.quizId', '$$q._id'] },
                        },
                      },
                    },
                  },
                  in: { $ifNull: ['$$att.score', 0] },
                },
              },

              isCompleted: {
                $let: {
                  vars: {
                    att: {
                      $first: {
                        $filter: {
                          input: '$quizAttemptsRaw',
                          as: 'a',
                          cond: { $eq: ['$$a.quizId', '$$q._id'] },
                        },
                      },
                    },
                  },
                  in: { $cond: [{ $ifNull: ['$$att', false] }, true, false] },
                },
              },
            },
          },
        },
      },
    },

    /** -----------------------------------------
     * QUIZ – FINAL OBJECT
     * -----------------------------------------*/
    {
      $set: {
        quiz: {
          total: { $size: '$quizzes' },
          completed: { $arrayElemAt: ['$quizStats.attempts', 0] },
          totalScore: { $arrayElemAt: ['$quizStats.totalScore', 0] },
          details: '$quizDetails',
        },
      },
    },

    /** -----------------------------------------
     * ASSIGNMENT LIST
     * -----------------------------------------*/
    {
      $lookup: {
        from: 'assignments',
        localField: 'courseId',
        foreignField: 'courseId',
        as: 'assignments',
      },
    },

    /** -----------------------------------------
     * ASSIGNMENT SUBMISSIONS RAW
     * -----------------------------------------*/
    {
      $lookup: {
        from: 'submissions',
        let: { sid: '$studentId', assignmentIds: '$assignments._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$studentId', '$$sid'] },
                  { $in: ['$assignmentId', '$$assignmentIds'] },
                ],
              },
            },
          },
          // Include graded work in the final calculation. Submission status
          // changes after grading, but its earned score must remain counted.
          {
            $match: {
              status: {
                $in: [
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.RESUBMITTED,
                  SubmissionStatus.OVERDUE,
                  SubmissionStatus.GRADED,
                ],
              },
            },
          },
        ],
        as: 'assignmentSubmissionsRaw',
      },
    },

    /** -----------------------------------------
     * ASSIGNMENT DETAILS
     * -----------------------------------------*/
    {
      $addFields: {
        assignmentDetails: {
          $map: {
            input: '$assignments',
            as: 'a',
            in: {
              assignmentId: '$$a._id',
              title: '$$a.title',

              score: {
                $let: {
                  vars: {
                    sub: {
                      $first: {
                        $filter: {
                          input: '$assignmentSubmissionsRaw',
                          as: 's',
                          cond: { $eq: ['$$s.assignmentId', '$$a._id'] },
                        },
                      },
                    },
                  },
                  in: { $ifNull: ['$$sub.grade', 0] },
                },
              },

              isCompleted: {
                $let: {
                  vars: {
                    sub: {
                      $first: {
                        $filter: {
                          input: '$assignmentSubmissionsRaw',
                          as: 's',
                          cond: { $eq: ['$$s.assignmentId', '$$a._id'] },
                        },
                      },
                    },
                  },
                  in: { $cond: [{ $ifNull: ['$$sub', false] }, true, false] },
                },
              },
            },
          },
        },
      },
    },

    /** -----------------------------------------
     * ASSIGNMENT STATS
     * -----------------------------------------*/
    {
      $set: {
        assignment: {
          total: { $size: '$assignments' },
          submitted: { $size: '$assignmentSubmissionsRaw' },
          totalGrade: { $sum: '$assignmentSubmissionsRaw.grade' },
          totalMaxScore: {
            $sum: {
              $map: {
                input: '$assignments',
                as: 'assignment',
                in: { $ifNull: ['$$assignment.maxScore', 10] },
              },
            },
          },
          details: '$assignmentDetails',
        },
      },
    },

    /** -----------------------------------------
     * CLEANUP (optional)
     * -----------------------------------------*/
    {
      $unset: [
        'quizzes',
        'quizAttemptsRaw',
        'quizStats',
        'assignments',
        'assignmentSubmissionsRaw',
      ],
    },

    // lessons & lessonProgresses
    {
      $lookup: { from: 'lessons', localField: 'courseId', foreignField: 'courseId', as: 'lessons' },
    },
    {
      $lookup: {
        from: 'lessonProgresses',
        let: { sid: '$studentId', cid: '$courseId' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$studentId', '$$sid'] }, { $eq: ['$courseId', '$$cid'] }] },
            },
          },
          { $match: { isCompleted: true } },
          { $group: { _id: null, completed: { $sum: 1 } } },
        ],
        as: 'lessonStats',
      },
    },
    {
      $set: {
        lesson: {
          total: { $size: '$lessons' },
          completed: { $ifNull: [{ $arrayElemAt: ['$lessonStats.completed', 0] }, 0] },
        },
      },
    },

    // compute a quick totalScore if needed
    { $set: { totalScore: { $add: ['$quiz.totalScore', '$assignment.totalGrade'] } } },

    // cleanup raw arrays to reduce payload
    {
      $project: {
        attendanceStats: 0,
        quizAttempts: 0,
        assignmentStats: 0,
        lessonStats: 0,
        quizzes: 0,
        assignments: 0,
        lessons: 0,
      },
    },
  ]);

  // 3. Build bulk updates + compute per-student derived values
  const bulkOps: any[] = [];
  const studentsOut: any[] = [];

  for (const s of stats) {
    // progress object for enrollment
    const progress = {
      totalLessons: s.lesson.total,
      completedLessons: s.lesson.completed,
      totalQuizzes: s.quiz.total,
      completedQuizzes: s.quiz.completed,
      totalQuizScores: s.quiz.totalScore,
      quizDetails: s.quiz.details,
      totalAssignments: s.assignment.total,
      completedAssignments: s.assignment.submitted,
      totalAssignmentScores: s.assignment.totalGrade,
      assignmentDetails: s.assignment.details,
      totalAttendances: s.attendance.total,
      completedAttendances: s.attendance.present,
      updatedAt: new Date(),
    };

    // Component scores are normalized to the 0..10 scale. Missing or
    // ungraded assignments contribute 0 while their maxScore remains in the
    // denominator, so the final score is not inflated.
    const quizAvg =
      progress.totalQuizzes > 0 ? progress.totalQuizScores / progress.totalQuizzes : 0;
    const assignmentAvg =
      s.assignment.totalMaxScore > 0
        ? (progress.totalAssignmentScores / s.assignment.totalMaxScore) * 10
        : 0;
    const attendanceAvg =
      progress.totalAttendances > 0
        ? (progress.completedAttendances / progress.totalAttendances) * 10
        : 0;

    // Course final grade: 30% quiz + 50% assignment + 20% attendance,
    // consistently expressed on a 0..10 scale.
    const weight = { quiz: 0.3, assignment: 0.5, attendance: 0.2 };
    const rawFinal =
      quizAvg * weight.quiz +
      assignmentAvg * weight.assignment +
      attendanceAvg * weight.attendance;
    const finalGrade = Math.round(rawFinal * 100) / 100; // 2 decimals

    const attendanceRate = progress.totalAttendances > 0
      ? progress.completedAttendances / progress.totalAttendances
      : 0;
    const isDropped = attendanceRate < 0.8 || finalGrade < 5;
    const status = isDropped ? EnrollmentStatus.DROPPED : EnrollmentStatus.COMPLETED;

    // bulk update: set progress, finalGrade, status, and droppedAt/completedAt appropriately
    const updateObj: any = {
      $set: {
        progress,
        finalGrade,
        status,
      },
    };
    if (isDropped) {
      updateObj.$set.droppedAt = new Date();
      updateObj.$unset = { completedAt: '' };
    } else {
      updateObj.$set.completedAt = new Date();
      updateObj.$unset = { droppedAt: '' };
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: s._id },
        update: updateObj,
      },
    });

    // prepare student output (clean)
    studentsOut.push({
      enrollmentId: s._id,
      student: s.student
        ? {
          _id: s.student._id,
          username: s.student.username,
          fullname: s.student.fullname,
          avatar_url: s.student.avatar_url,
        }
        : null,
      progress: {
        lessons: {
          total: progress.totalLessons,
          completed: progress.completedLessons,
          percent: progress.totalLessons
            ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
            : 0,
        },
        quizzes: {
          total: progress.totalQuizzes,
          completed: progress.completedQuizzes,
          score: progress.totalQuizScores,
        },
        assignments: {
          total: progress.totalAssignments,
          completed: progress.completedAssignments,
          score: progress.totalAssignmentScores,
        },
        attendance: {
          total: progress.totalAttendances,
          present: progress.completedAttendances,
          absent: progress.totalAttendances - progress.completedAttendances,
        },
      },
      scores: {
        quiz: quizAvg,
        assignment: assignmentAvg,
        attendance: attendanceAvg,
      },
      finalGrade,
      status,
    });
  }

  // perform bulkWrite if needed
  if (bulkOps.length > 0) {
    await EnrollmentModel.bulkWrite(bulkOps);
  }

  const statsCourse = course.statistics ?? {};

  // 4. Determine course-level totals: prefer metadata on course, otherwise fallback to counting collections
  let lessonsCount =
    typeof statsCourse.totalLessons === 'number' && statsCourse.totalLessons > 0
      ? statsCourse.totalLessons
      : null;
  let quizzesCount =
    typeof statsCourse.totalQuizzes === 'number' && statsCourse.totalQuizzes > 0
      ? statsCourse.totalQuizzes
      : null;
  let assignmentsCount =
    typeof statsCourse.totalAssignments === 'number' && statsCourse.totalAssignments > 0
      ? statsCourse.totalAssignments
      : null;
  let attendancesCount =
    typeof statsCourse.totalAttendances === 'number' && statsCourse.totalAttendances > 0
      ? statsCourse.totalAttendances
      : null;

  if (
    lessonsCount === null ||
    quizzesCount === null ||
    assignmentsCount === null ||
    attendancesCount === null
  ) {
    // run counts only for missing values
    const promises: Promise<any>[] = [];
    if (lessonsCount === null) promises.push(LessonModel.countDocuments({ courseId }));
    else promises.push(Promise.resolve(lessonsCount));
    if (quizzesCount === null) promises.push(QuizModel.countDocuments({ courseId }));
    else promises.push(Promise.resolve(quizzesCount));
    if (assignmentsCount === null) promises.push(AssignmentModel.countDocuments({ courseId }));
    else promises.push(Promise.resolve(assignmentsCount));
    if (attendancesCount === null)
      promises.push(
        EnrollmentModel.aggregate([
          // fallback: average attendance total from stats
          {
            $match: {
              courseId: course._id,
              role: Role.STUDENT,
              status: {
                $in: [
                  EnrollmentStatus.APPROVED,
                  EnrollmentStatus.DROPPED,
                  EnrollmentStatus.COMPLETED,
                ],
              },
            },
          },
          { $group: { _id: null, avgAttendances: { $avg: '$progress.totalAttendances' } } },
        ]).then((r: any[]) => (r[0]?.avgAttendances ? Math.round(r[0].avgAttendances) : 0))
      );
    const [lc, qc, ac, atc] = await Promise.all(promises);
    lessonsCount = lessonsCount === null ? lc : lessonsCount;
    quizzesCount = quizzesCount === null ? qc : quizzesCount;
    assignmentsCount = assignmentsCount === null ? ac : assignmentsCount;
    attendancesCount = attendancesCount === null ? atc : attendancesCount;
  }

  // 5. Build summary stats from studentsOut
  const totalStudents = studentsOut.length;
  const averageFinalGrade = totalStudents
    ? Math.round((studentsOut.reduce((acc, x) => acc + x.finalGrade, 0) / totalStudents) * 100) /
    100
    : 0;
  const droppedCount = studentsOut.filter((s) => s.status === EnrollmentStatus.DROPPED).length;
  const passCount = studentsOut.filter((s) => s.status !== EnrollmentStatus.DROPPED).length;
  const averageAttendance = totalStudents
    ? Math.round(
      (studentsOut.reduce(
        (acc, x) => acc + x.progress.attendance.present / (x.progress.attendance.total || 1),
        0
      ) /
        totalStudents) *
      100
    )
    : 0;
  const averageQuizScore = totalStudents
    ? Math.round(
      (studentsOut.reduce((acc, x) => acc + (x.scores.quiz || 0), 0) / totalStudents) *
      100
    ) / 100
    : 0;
  const averageAssignmentScore = totalStudents
    ? Math.round(
      (studentsOut.reduce((acc, x) => acc + (x.scores.assignment || 0), 0) /
        totalStudents) *
      100
    ) / 100
    : 0;

  const summary = {
    averageFinalGrade,
    passRate: totalStudents ? Math.round((passCount / totalStudents) * 100) : 0,
    droppedRate: totalStudents ? Math.round((droppedCount / totalStudents) * 100) : 0,
    averageAttendance,
    averageQuizScore,
    averageAssignmentScore,
  };

  // mark course completed
  await CourseModel.findByIdAndUpdate(courseId, {
    $set: {
      status: CourseStatus.COMPLETED,
      completedAt: new Date(),
      statistics: {
        totalStudents: totalStudents,
        totalLessons: lessonsCount,
        totalQuizzes: quizzesCount,
        averageQuizScore: averageQuizScore,
        totalAssignments: assignmentsCount,
        averageAssignmentScore: averageAssignmentScore,
        averageFinalGrade: averageFinalGrade,
        totalAttendances: attendancesCount,
        averageAttendance: averageAttendance,
        passRate: summary.passRate,
        droppedRate: summary.droppedRate,
      },
    },
  });

  // 6. Return neatly shaped object
  return {
    course: {
      _id: course._id,
      name: course.title,
      semester: course.semesterId ?? null,
      teachers: course.teacherIds ?? [],
      totalStudents,
      totalLessons: lessonsCount,
      totalQuizzes: quizzesCount,
      totalAssignments: assignmentsCount,
      totalAttendances: attendancesCount,
    },
    summary,
    students: studentsOut,
  };
};

/**
 * Lấy thống kê khóa học
 * @param courseId - ID của khóa học
 * @returns Thống kê khóa học
 */
export const getCourseStatistics = async (
  courseId: string,
  userId?: Types.ObjectId,
  userRole?: Role
) => {
  // Validate courseId format
  appAssert(
    courseId && courseId.match(/^[0-9a-fA-F]{24}$/),
    BAD_REQUEST,
    'Invalid course ID format'
  );

  // Lấy thông tin khóa học (chỉ lấy những khóa học chưa bị xóa)
  const course = await CourseModel.findOne({
    _id: courseId,
    isDeleted: false,
  })
    .select('_id title statistics status semesterId teacherIds')
    .populate('teacherIds', 'username fullname avatar_url')
    .populate('semesterId', 'name year type')
    .lean();

  appAssert(course, NOT_FOUND, 'Course not found');

  // Check permission: Teacher can only view statistics of their own course
  if (userRole === Role.TEACHER) {
    const isTeacherOfCourse = course.teacherIds.some((teacher: any) => teacher._id.equals(userId));
    appAssert(
      isTeacherOfCourse,
      FORBIDDEN,
      "You don't have permission to view statistics for this course"
    );
  }

  // Kiểm tra xem khóa học đã có thống kê chưa
  if (!course.statistics || Object.keys(course.statistics).length === 0) {
    return {
      courseId: course._id,
      courseName: course.title,
      semester: course.semesterId,
      teachers: course.teacherIds || [],
      statistics: null,
      students: [],
      message: 'Course statistics not available yet. Please complete the course first.',
    };
  }

  // Query students details from Enrollment
  const enrollments = await EnrollmentModel.find({
    courseId: course._id,
    role: Role.STUDENT,
    status: {
      $in: [EnrollmentStatus.APPROVED, EnrollmentStatus.DROPPED, EnrollmentStatus.COMPLETED],
    },
  })
    .populate('studentId', 'username fullname avatar_url')
    .select('studentId progress finalGrade status')
    .lean();

  // Transform enrollments to match completeCourse students format
  const students = enrollments.map((enrollment: any) => ({
    enrollmentId: enrollment._id,
    student: enrollment.studentId
      ? {
        _id: enrollment.studentId._id,
        username: enrollment.studentId.username,
        fullname: enrollment.studentId.fullname,
        avatar_url: enrollment.studentId.avatar_url,
      }
      : null,
    progress: {
      lessons: {
        total: enrollment.progress?.totalLessons || 0,
        completed: enrollment.progress?.completedLessons || 0,
        percent:
          enrollment.progress?.totalLessons > 0
            ? Math.round(
              (enrollment.progress.completedLessons / enrollment.progress.totalLessons) * 100
            )
            : 0,
      },
      quizzes: {
        total: enrollment.progress?.totalQuizzes || 0,
        completed: enrollment.progress?.completedQuizzes || 0,
        score: enrollment.progress?.totalQuizScores || 0,
      },
      assignments: {
        total: enrollment.progress?.totalAssignments || 0,
        completed: enrollment.progress?.completedAssignments || 0,
        score: enrollment.progress?.totalAssignmentScores || 0,
      },
      attendance: {
        total: enrollment.progress?.totalAttendances || 0,
        present: enrollment.progress?.completedAttendances || 0,
        absent:
          (enrollment.progress?.totalAttendances || 0) -
          (enrollment.progress?.completedAttendances || 0),
      },
    },
    finalGrade: enrollment.finalGrade || 0,
    status: enrollment.status,
  }));

  // Trả về thống kê
  return {
    courseId: course._id,
    courseName: course.title,
    semester: course.semesterId,
    teachers: course.teacherIds || [],
    statistics: course.statistics,
    students,
  };
};
