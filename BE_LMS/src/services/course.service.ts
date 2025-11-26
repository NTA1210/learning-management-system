import CourseModel from '../models/course.model';
import SpecialistModel from '../models/specialist.model';
import UserModel from '../models/user.model';
import EnrollmentModel from '../models/enrollment.model';
import { Types } from 'mongoose';
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
import { QuizModel } from '@/models';
import { snapShotQuestion } from '@/validators/quiz.schemas';

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
  from?: Date; // Date range start for createdAt filtering
  to?: Date; // Date range end for createdAt filtering
  subjectId?: string; // ✅ NEW: Filter by subject instead of specialist
  semesterId?: string; // ✅ NEW: Filter by semester
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
  from,
  to,
  subjectId,
  semesterId,
  teacherId,
  isPublished,
  status,
  includeDeleted,
  onlyDeleted,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  userRole,
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

  // ❌ FIX: Validate subjectId/teacherId if provided
  if (subjectId) {
    appAssert(subjectId.match(/^[0-9a-fA-F]{24}$/), BAD_REQUEST, 'Invalid subject ID format');
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

  // Determine final status and publish state
  let finalIsPublished = data.isPublished || false;
  let finalStatus = data.status || CourseStatus.DRAFT;

  if (!isAdmin) {
    // Teacher CANNOT publish course immediately - cần admin approve
    // Force isPublished = false regardless of input
    finalIsPublished = false;
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

  return populatedCourse;
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

  // ❌ FIX: Cannot update completed course
  appAssert(
    course.status !== CourseStatus.COMPLETED,
    BAD_REQUEST,
    'Cannot update a completed course'
  );

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

  // ✅ YÊU CẦU 2: Only Admin can approve/publish courses
  // Teacher không thể tự publish course của mình
  // Prepare update data
  const updateData: any = { ...data };

  // ✅ FIX: Teacher CANNOT change isPublished field at all
  // - Cannot publish (set true)
  // - Cannot unpublish (set false) if already published by admin
  if (!isAdmin && data.isPublished !== undefined) {
    // Teacher tries to change isPublished field
    delete updateData.isPublished;
    // Note: Only admin can control publish status
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
    subjectId,
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
      // Optional: Filter by enrollment status if needed (e.g., only APPROVED)
      status: EnrollmentStatus.APPROVED,
    }).select('courseId');

    const courseIds = enrollments.map((e) => e.courseId);
    filter._id = { $in: courseIds };
  } else if (userRole === Role.TEACHER) {
    // Teacher: Created by me OR Assigned to me
    filter.$or = [{ createdBy: userId }, { teacherIds: userId }];
  } else if (userRole === Role.ADMIN) {
    // Admin: See all (no extra filter needed on _id/owner)
  }

  // 2. Common filters (Search, Subject, Semester, Status, Published)
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (subjectId) filter.subjectId = subjectId;
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
  { courseId, isPublished, isCompleted, isDeleted, page = 1, limit = 10, search }: GetQuizzes,
  role: string
) => {
  const filter: any = {};

  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');
  filter.courseId = courseId;

  if (role === Role.STUDENT) {
    filter.isPublished = true;
    filter.deletedAt = null;
  } else {
    if (isPublished !== undefined) filter.isPublished = isPublished;
    if (isCompleted !== undefined) {
      if (isCompleted) filter.endTime = { $gte: new Date() };
      else filter.endTime = { $lt: new Date() };
    }
    if (isDeleted !== undefined) {
      if (isDeleted) filter.deletedAt = { $ne: null };
      else filter.deletedAt = null;
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
