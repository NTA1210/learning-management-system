import mongoose, { SortOrder } from 'mongoose';
import { AttendanceModel, CourseModel, EnrollmentModel, LessonModel, UserModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '@/constants/http';
import { Role } from '@/types';
import { EnrollmentStatus } from '@/types/enrollment.type';

export const normalizeDateOnly = (value: Date) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const daysDiffFromToday = (value: Date) => {
  const today = normalizeDateOnly(new Date());
  const target = normalizeDateOnly(value);
  const diffMs = today.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const ensureCourseExists = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');
  return course;
};

export const assertInstructorAccess = (course: any, userId: mongoose.Types.ObjectId | string) => {
  const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const isInstructor = (course.teacherIds || []).some((id: mongoose.Types.ObjectId) =>
    id.equals(targetId)
  );
  appAssert(isInstructor, FORBIDDEN, 'Teacher not assigned to this course');
  return true;
};

export const ensureAttendanceManagePermission = async (
  courseId: string,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const course = await ensureCourseExists(courseId);
  if (role === Role.ADMIN) {
    return course;
  }
  // If not ADMIN, must be TEACHER (middleware already ensures this)
  // Only need to verify teacher is assigned to this course
  assertInstructorAccess(course, actorId);
  return course;
};

export const assertDateWithinCourseSchedule = (
  course: { startDate: Date; endDate: Date },
  targetDate: Date
) => {
  const normalizedStart = normalizeDateOnly(course.startDate);
  const normalizedEnd = normalizeDateOnly(course.endDate);
  const normalizedTarget = normalizeDateOnly(targetDate);

  appAssert(
    normalizedTarget >= normalizedStart && normalizedTarget <= normalizedEnd,
    BAD_REQUEST,
    'Attendance date must fall within course schedule'
  );
};

export const clampDateRangeToCourse = (
  course: { startDate: Date; endDate: Date },
  from?: Date,
  to?: Date
) => {
  const normalizedStart = normalizeDateOnly(course.startDate);
  const normalizedEnd = normalizeDateOnly(course.endDate);
  const normalizedFrom = from ? normalizeDateOnly(from) : normalizedStart;
  const normalizedTo = to ? normalizeDateOnly(to) : normalizedEnd;

  const clampedFrom = normalizedFrom < normalizedStart ? normalizedStart : normalizedFrom;
  const clampedTo = normalizedTo > normalizedEnd ? normalizedEnd : normalizedTo;

  appAssert(clampedFrom <= clampedTo, BAD_REQUEST, 'Date range must overlap with course schedule');

  return { from: clampedFrom, to: clampedTo };
};

export const verifyStudentsBelongToCourse = async (
  courseId: string,
  studentIds: string[]
) => {
  if (!studentIds.length) return;

  // Convert string IDs to ObjectId for MongoDB query
  const studentObjectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));

  const enrollments = await EnrollmentModel.find({
    courseId,
    studentId: { $in: studentObjectIds },
    status: EnrollmentStatus.APPROVED,
  }).select('studentId');

  const enrolledSet = new Set(enrollments.map((item) => item.studentId.toString()));
  const missing = studentIds.filter((id) => !enrolledSet.has(id));
  appAssert(missing.length === 0, BAD_REQUEST, 'Student not enrolled in course');
};

export const buildDateRangeFilter = (from?: Date, to?: Date) => {
  if (!from && !to) return undefined;
  const range: Record<string, Date> = {};
  if (from) range.$gte = normalizeDateOnly(from);
  if (to) {
    const end = normalizeDateOnly(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
};