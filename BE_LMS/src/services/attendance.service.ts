import mongoose, { SortOrder } from 'mongoose';
import { AttendanceModel, CourseModel, EnrollmentModel, LessonModel, UserModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '@/constants/http';
import { Role } from '@/types';
import { AttendanceStatus } from '@/types/attendance.type';
import { EnrollmentStatus } from '@/types/enrollment.type';
import { isDateInFuture } from '@/utils/date';
import {
  MarkAttendanceInput,
  UpdateAttendanceInput,
  ListAttendanceInput,
  ExportAttendanceInput,
  CourseStatsInput,
  StudentHistoryInput,
} from '@/validators/attendance.schemas';

const MAX_BACKDATE_DAYS = 7;
const REASON_REQUIRED_AFTER_DAYS = 1;
const LATE_THRESHOLD_FOR_ALERT = 3;

const normalizeDateOnly = (value: Date) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const daysDiffFromToday = (value: Date) => {
  const today = normalizeDateOnly(new Date());
  const target = normalizeDateOnly(value);
  const diffMs = today.getTime() - target.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const ensureCourseExists = async (courseId: string) => {
  const course = await CourseModel.findById(courseId);
  appAssert(course, NOT_FOUND, 'Course not found');
  return course;
};

const assertInstructorAccess = (course: any, userId: mongoose.Types.ObjectId | string) => {
  const targetId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const isInstructor = (course.teacherIds || []).some((id: mongoose.Types.ObjectId) =>
    id.equals(targetId)
  );
  appAssert(isInstructor, FORBIDDEN, 'Teacher not assigned to this course');
  return true;
};

const ensureAttendanceManagePermission = async (
  courseId: string,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const course = await ensureCourseExists(courseId);
  if (role === Role.ADMIN) {
    return course;
  }
  appAssert(role === Role.TEACHER, FORBIDDEN, 'Not authorized');
  assertInstructorAccess(course, actorId);
  return course;
};

const assertDateWithinCourseSchedule = (
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

const clampDateRangeToCourse = (
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

const verifyStudentsBelongToCourse = async (
  courseId: string,
  studentIds: mongoose.Types.ObjectId[]
) => {
  if (!studentIds.length) return;

  const enrollments = await EnrollmentModel.find({
    courseId,
    studentId: { $in: studentIds },
    status: EnrollmentStatus.APPROVED,
  }).select('studentId');

  const enrolledSet = new Set(enrollments.map((item) => item.studentId.toString()));
  const missing = studentIds.filter((id) => !enrolledSet.has(id.toString()));
  appAssert(missing.length === 0, BAD_REQUEST, 'Student not enrolled in course');
};

const buildDateRangeFilter = (from?: Date, to?: Date) => {
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

const buildAttendanceFilter = async (
  params: ListAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const filter: Record<string, any> = {};
  let courseDateRange: {
    from: Date;
    to: Date;
  } | null = null;

  if (params.courseId) {
    filter.courseId = new mongoose.Types.ObjectId(params.courseId);
    const course = await ensureAttendanceManagePermission(params.courseId, actorId, role);
    courseDateRange = clampDateRangeToCourse(
      course as { startDate: Date; endDate: Date },
      params.from,
      params.to
    );
  } else {
    appAssert(role === Role.ADMIN, BAD_REQUEST, 'courseId is required unless you are an admin');
  }

  if (params.studentId) {
    filter.studentId = new mongoose.Types.ObjectId(params.studentId);
  }

  if (params.teacherId) {
    filter.markedBy = new mongoose.Types.ObjectId(params.teacherId);
  }

  if (params.status) {
    filter.status = params.status;
  }

  const dateFilter = courseDateRange
    ? buildDateRangeFilter(courseDateRange.from, courseDateRange.to)
    : buildDateRangeFilter(params.from, params.to);
  if (dateFilter) {
    filter.date = dateFilter;
  }

  return filter;
};

const getSortObject = (sortBy?: string, sortOrder?: string): Record<string, SortOrder> => {
  const sortField = sortBy || 'date';
  const order: SortOrder = sortOrder === 'asc' ? 1 : -1;
  return { [sortField]: order };
};

const summarizeStatuses = (records: any[]) => {
  const summary = {
    total: records.length,
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.ABSENT]: 0,
    [AttendanceStatus.LATE]: 0,
    [AttendanceStatus.EXCUSED]: 0,
  };

  records.forEach((record) => {
    summary[record.status as AttendanceStatus] += 1;
  });

  return summary;
};

const enforceTeacherEditWindow = (targetDate: Date, role: Role, reason?: string) => {
  if (role === Role.ADMIN) return;
  const diffDays = daysDiffFromToday(targetDate);
  appAssert(diffDays <= MAX_BACKDATE_DAYS, FORBIDDEN, 'Cannot modify attendance older than 7 days');

  if (diffDays > REASON_REQUIRED_AFTER_DAYS) {
    appAssert(!!reason, BAD_REQUEST, 'Reason is required for late updates');
  }
};

/**
 * Nghiệp vụ 3 & 7: Admin/Teacher xem danh sách attendance với filter, thống kê.
 * - Cho phép lọc theo course, student, teacher, status, date range.
 * - Trả summary trạng thái để hỗ trợ thống kê nhanh.
 */
export const listAttendances = async (
  params: ListAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  appAssert(role !== Role.STUDENT, FORBIDDEN, 'Not authorized');

  const filter = await buildAttendanceFilter(params, actorId, role);
  const page = params.page;
  const limit = params.limit;
  const skip = (page - 1) * limit;
  const sort = getSortObject(params.sortBy, params.sortOrder);

  const [records, total, summaryAgg] = await Promise.all([
    AttendanceModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'fullname username email')
      .populate('courseId', 'title code')
      .populate('markedBy', 'fullname email role')
      .lean(),
    AttendanceModel.countDocuments(filter),
    AttendanceModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = summaryAgg.reduce(
    (acc, curr) => {
      acc[curr._id as AttendanceStatus] = curr.count;
      acc.total += curr.count;
      return acc;
    },
    {
      total: 0,
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LATE]: 0,
      [AttendanceStatus.EXCUSED]: 0,
    }
  );

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + records.length < total,
    },
    summary,
  };
};

/**
 * Nghiệp vụ 4: Student xem lịch sử điểm danh của chính mình,
 * Teacher/Admin có thể xem lịch sử của học viên thuộc course họ dạy/quản lý.
 */
export const getStudentAttendanceHistory = async (
  studentId: string,
  params: StudentHistoryInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  if (role === Role.STUDENT) {
    appAssert(
      actorId.toString() === studentId,
      FORBIDDEN,
      'Students can only view their own attendance'
    );
  }

  let dateRangeOverride: { from: Date; to: Date } | null = null;

  if (role === Role.TEACHER) {
    appAssert(params.courseId, BAD_REQUEST, 'courseId is required for teachers');
  }

  if (params.courseId && role !== Role.STUDENT) {
    const course = await ensureAttendanceManagePermission(params.courseId, actorId, role);
    if (role === Role.TEACHER) {
      await verifyStudentsBelongToCourse(params.courseId, [new mongoose.Types.ObjectId(studentId)]);
    }
    dateRangeOverride = clampDateRangeToCourse(
      course as { startDate: Date; endDate: Date },
      params.from,
      params.to
    );
  }

  const filter: Record<string, any> = {
    studentId: new mongoose.Types.ObjectId(studentId),
  };

  if (params.courseId) {
    filter.courseId = new mongoose.Types.ObjectId(params.courseId);
  }

  if (params.status) {
    filter.status = params.status;
  }

  const dateFilter = dateRangeOverride
    ? buildDateRangeFilter(dateRangeOverride.from, dateRangeOverride.to)
    : buildDateRangeFilter(params.from, params.to);
  if (dateFilter) {
    filter.date = dateFilter;
  }

  const page = params.page;
  const limit = params.limit;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    AttendanceModel.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('courseId', 'title code')
      .populate('markedBy', 'fullname email role')
      .lean(),
    AttendanceModel.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    summary: summarizeStatuses(records),
  };
};

/**
 * Nghiệp vụ 4: Shortcut cho student tự xem lịch sử attendance của bản thân.
 */
export const getSelfAttendanceHistory = async (
  actorId: mongoose.Types.ObjectId,
  params: StudentHistoryInput
) => {
  return getStudentAttendanceHistory(actorId.toString(), params, actorId, Role.STUDENT);
};

const formatCsvValue = (value: string | Date | undefined | null) => {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.includes(',')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Nghiệp vụ 6: Export attendance theo course/teacher/admin dưới dạng CSV/JSON.
 * - Bao gồm thông tin student, course, status, người đánh dấu và summary.
 */
export const exportAttendanceReport = async (
  params: ExportAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const filter = await buildAttendanceFilter(params, actorId, role);

  const records = await AttendanceModel.find(filter)
    .populate('studentId', 'fullname username email')
    .populate('courseId', 'title code')
    .populate('markedBy', 'fullname email role')
    .sort({ date: 1 })
    .lean<any>();

  const summary = summarizeStatuses(records);

  if (params.format === 'json') {
    return {
      format: 'json',
      summary,
      data: records,
    };
  }

  const header = [
    'studentName',
    'studentEmail',
    'course',
    'date',
    'status',
    'markedBy',
    'markedByRole',
  ];

  const csvRows = (records as Record<string, any>[]).map((record) => [
    formatCsvValue(record.studentId?.fullname || record.studentId?.username || ''),
    formatCsvValue(record.studentId?.email),
    formatCsvValue(record.courseId?.title),
    formatCsvValue(
      record.date instanceof Date ? record.date.toISOString().split('T')[0] : record.date
    ),
    formatCsvValue(record.status),
    formatCsvValue(record.markedBy?.fullname || record.markedBy?.email),
    formatCsvValue(record.markedBy?.role),
  ]);

  const csv = [
    header.join(','),
    ...csvRows.map((row: (string | number | undefined)[]) =>
      row.map((cell) => (cell === undefined ? '' : String(cell))).join(',')
    ),
  ].join('\n');

  return {
    format: 'csv',
    summary,
    csv,
    total: records.length,
  };
};

const computeLongestAbsentStreak = (records: { status: AttendanceStatus; date: Date }[]) => {
  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  records.forEach((record) => {
    const currentDate = normalizeDateOnly(record.date);
    if (
      lastDate &&
      currentDate.getTime() - lastDate.getTime() === 24 * 60 * 60 * 1000 &&
      record.status === AttendanceStatus.ABSENT
    ) {
      currentStreak += 1;
    } else {
      currentStreak = record.status === AttendanceStatus.ABSENT ? 1 : 0;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    lastDate = currentDate;
  });

  return maxStreak;
};

const mapStudentInfo = async (studentIds: mongoose.Types.ObjectId[]) => {
  const uniqueIds = Array.from(new Set(studentIds.map((id) => id.toString()))).map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  if (!uniqueIds.length) {
    return {};
  }

  const users = await UserModel.find({ _id: { $in: uniqueIds } })
    .select('fullname username email')
    .lean();

  return users.reduce<Record<string, any>>((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});
};

/**
 * Nghiệp vụ 7: Thống kê attendance của toàn course (tỉ lệ chuyên cần, học viên nguy cơ).
 * - Cảnh báo nếu vắng vượt threshold hoặc đi trễ nhiều.
 */
export const getCourseAttendanceStats = async (
  courseId: string,
  params: CourseStatsInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const course = await ensureAttendanceManagePermission(courseId, actorId, role);

  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const filter: Record<string, any> = { courseId: courseObjectId };
  const { from, to } = clampDateRangeToCourse(
    course as { startDate: Date; endDate: Date },
    params.from,
    params.to
  );
  const dateFilter = buildDateRangeFilter(from, to);
  if (dateFilter) filter.date = dateFilter;

  const records = await AttendanceModel.find(filter)
    .select('studentId status date')
    .sort({ date: 1 })
    .lean();

  const studentMap = await mapStudentInfo(
    records.map((record) => record.studentId as mongoose.Types.ObjectId)
  );

  const statsByStudent: Record<
    string,
    {
      counts: Record<AttendanceStatus, number>;
      total: number;
      longestAbsentStreak: number;
    }
  > = {};

  records.forEach((record) => {
    const id = record.studentId.toString();
    if (!statsByStudent[id]) {
      statsByStudent[id] = {
        counts: {
          [AttendanceStatus.PRESENT]: 0,
          [AttendanceStatus.ABSENT]: 0,
          [AttendanceStatus.LATE]: 0,
          [AttendanceStatus.EXCUSED]: 0,
        },
        total: 0,
        longestAbsentStreak: 0,
      };
    }
    statsByStudent[id].counts[record.status] += 1;
    statsByStudent[id].total += 1;
  });

  Object.entries(statsByStudent).forEach(([studentId, data]) => {
    const studentRecords = records.filter((record) => record.studentId.toString() === studentId);
    data.longestAbsentStreak = computeLongestAbsentStreak(
      studentRecords as { status: AttendanceStatus; date: Date }[]
    );
  });

  const threshold = params.threshold ?? 20;

  const studentStats = Object.entries(statsByStudent).map(([studentId, data]) => {
    const attended =
      data.counts[AttendanceStatus.PRESENT] +
      data.counts[AttendanceStatus.LATE] +
      data.counts[AttendanceStatus.EXCUSED];
    const attendanceRate = data.total ? Number(((attended / data.total) * 100).toFixed(2)) : 0;
    const absentRate = data.total
      ? Number(((data.counts[AttendanceStatus.ABSENT] / data.total) * 100).toFixed(2))
      : 0;

    return {
      studentId,
      student: studentMap[studentId] || null,
      counts: data.counts,
      totalSessions: data.total,
      attendanceRate,
      absentRate,
      longestAbsentStreak: data.longestAbsentStreak,
      alerts: {
        highAbsence: absentRate >= threshold,
        lateTooOften: data.counts[AttendanceStatus.LATE] >= LATE_THRESHOLD_FOR_ALERT,
      },
    };
  });

  const totalSessions = Object.values(statsByStudent).reduce((acc, curr) => acc + curr.total, 0);

  const classAttendanceRate =
    totalSessions === 0
      ? 0
      : Number(
          (
            (records.filter((record) => record.status !== AttendanceStatus.ABSENT).length /
              totalSessions) *
            100
          ).toFixed(2)
        );

  const studentsAtRisk = studentStats.filter((stat) => stat.alerts.highAbsence);
  const oftenLateStudents = studentStats.filter(
    (stat) => stat.counts[AttendanceStatus.LATE] >= LATE_THRESHOLD_FOR_ALERT
  );

  return {
    courseId,
    totalStudents: studentStats.length,
    totalRecords: records.length,
    classAttendanceRate,
    studentsAtRisk,
    oftenLateStudents,
    studentStats,
    threshold,
  };
};

/**
 * Nghiệp vụ 7: Thống kê attendance của một học viên trong course.
 * - Tính tỷ lệ chuyên cần, dài chuỗi vắng.
 */
export const getStudentAttendanceStats = async (
  courseId: string,
  studentId: string,
  params: CourseStatsInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const course = await ensureAttendanceManagePermission(courseId, actorId, role);

  await verifyStudentsBelongToCourse(courseId, [new mongoose.Types.ObjectId(studentId)]);

  const filter: Record<string, any> = {
    courseId: new mongoose.Types.ObjectId(courseId),
    studentId: new mongoose.Types.ObjectId(studentId),
  };
  const { from, to } = clampDateRangeToCourse(
    course as { startDate: Date; endDate: Date },
    params.from,
    params.to
  );
  const dateFilter = buildDateRangeFilter(from, to);
  if (dateFilter) filter.date = dateFilter;

  const records = await AttendanceModel.find(filter).sort({ date: 1 }).lean();

  const counts = summarizeStatuses(records);
  const total = records.length;
  const attended =
    counts[AttendanceStatus.PRESENT] +
    counts[AttendanceStatus.LATE] +
    counts[AttendanceStatus.EXCUSED];

  const studentInfo = await UserModel.findById(studentId).select('fullname username email').lean();

  return {
    courseId,
    studentId,
    student: studentInfo,
    counts,
    total,
    attendanceRate: total ? Number(((attended / total) * 100).toFixed(2)) : 0,
    longestAbsentStreak: computeLongestAbsentStreak(
      records as { status: AttendanceStatus; date: Date }[]
    ),
  };
};
