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

import{
  normalizeDateOnly,
  daysDiffFromToday,  
  assertDateWithinCourseSchedule,
  clampDateRangeToCourse,
  buildDateRangeFilter,
  ensureAttendanceManagePermission,
  verifyStudentsBelongToCourse,  
} from './helpers/attendaceHelpers';

const MAX_BACKDATE_DAYS = 7;
const REASON_REQUIRED_AFTER_DAYS = 1;



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
    [AttendanceStatus.NOTYET]: 0,
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.ABSENT]: 0,

  };

  records.forEach((record) => {
    summary[record.status as AttendanceStatus] += 1;
  });

  return summary;
};



const enforceTeacherEditWindow = (
  targetDate: Date,
  role: Role,
  oldStatus?: AttendanceStatus,
  newStatus?: AttendanceStatus,
  reason?: string
) => {
  if (role === Role.ADMIN) return;
  const diffDays = daysDiffFromToday(targetDate);
  appAssert(diffDays <= MAX_BACKDATE_DAYS, FORBIDDEN, 'Cannot modify attendance older than 7 days');

  // Require reason when changing from ABSENT to PRESENT
  if (oldStatus === AttendanceStatus.ABSENT && newStatus === AttendanceStatus.PRESENT) {
    appAssert(!!reason, BAD_REQUEST, "Reason is required when changing from ABSENT to PRESENT");
  }

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
      [AttendanceStatus.NOTYET]: 0,
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
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
          [AttendanceStatus.NOTYET]: 0,
          [AttendanceStatus.PRESENT]: 0,
          [AttendanceStatus.ABSENT]: 0,
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

    // Only count records that have been marked (not NOTYET)
    const markedCount = data.counts[AttendanceStatus.PRESENT] + data.counts[AttendanceStatus.ABSENT];
    const attended = data.counts[AttendanceStatus.PRESENT];
    
    // Attendance rate: PRESENT / (PRESENT + ABSENT), excluding NOTYET
    const attendanceRate = markedCount > 0
      ? Number(((attended / markedCount) * 100).toFixed(2))
      : 0;
    
    // Absent rate: ABSENT / (PRESENT + ABSENT), excluding NOTYET
    const absentRate = markedCount > 0
      ? Number(((data.counts[AttendanceStatus.ABSENT] / markedCount) * 100).toFixed(2))
      : 0;

    return {
      studentId,
      student: studentMap[studentId] || null,
      counts: data.counts,
      totalSessions: data.total,
      markedSessions: markedCount,
      attendanceRate,
      absentRate,
      longestAbsentStreak: data.longestAbsentStreak,
      alerts: {
        highAbsence: absentRate >= threshold,
      },
    };
  });


  // Calculate class attendance rate based on marked records only (excluding NOTYET)
  const markedRecords = records.filter(
    (record) => record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.ABSENT
  );
  const presentRecords = records.filter(
    (record) => record.status === AttendanceStatus.PRESENT
  );

  const classAttendanceRate =
    markedRecords.length === 0
      ? 0
      : Number(

          ((presentRecords.length / markedRecords.length) * 100).toFixed(2)
        );

  const studentsAtRisk = studentStats.filter((stat) => stat.alerts.highAbsence);

  return {
    courseId,
    totalStudents: studentStats.length,
    totalRecords: records.length,
    classAttendanceRate,
    studentsAtRisk,
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
  
  // Only count records that have been marked (not NOTYET)
  const markedCount = counts[AttendanceStatus.PRESENT] + counts[AttendanceStatus.ABSENT];
  const attended = counts[AttendanceStatus.PRESENT];

  const studentInfo = await UserModel.findById(studentId).select('fullname username email').lean();

  // Attendance rate: PRESENT / (PRESENT + ABSENT), excluding NOTYET
  const attendanceRate = markedCount > 0
    ? Number(((attended / markedCount) * 100).toFixed(2))
    : 0;

  return {
    courseId,
    studentId,
    student: studentInfo,
    counts,
    total,
    markedSessions: markedCount,
    attendanceRate,
    longestAbsentStreak: computeLongestAbsentStreak(
      records as { status: AttendanceStatus; date: Date }[]
    ),
  };
};

/**
 * Nghiệp vụ 1: Teacher/Admin đánh dấu điểm danh cho học viên trong một khóa học.
 * - Chỉ instructor của course hoặc admin mới được thao tác.
 * - Không cho phép ghi nhận ngày tương lai, enforce 1 record/student-course-date.
 * - Tự động upsert trạng thái cho danh sách student truyền vào.
 */
export const markAttendance = async (
  payload: MarkAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const { courseId, date, entries } = payload;
  const normalizedDate = normalizeDateOnly(date);

  appAssert(!isDateInFuture(normalizedDate), BAD_REQUEST, "Cannot mark future date");

  const course = await ensureAttendanceManagePermission(courseId, actorId, role);
  assertDateWithinCourseSchedule(
    course as { startDate: Date; endDate: Date },
    normalizedDate
  );

  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const studentIdMap = new Map<string, mongoose.Types.ObjectId>();

  entries.forEach((entry) => {
    if (!studentIdMap.has(entry.studentId)) {
      studentIdMap.set(entry.studentId, new mongoose.Types.ObjectId(entry.studentId));
    }
  });

  const studentObjectIds = Array.from(studentIdMap.values());
  await verifyStudentsBelongToCourse(courseId, studentObjectIds);

  const operations = entries.map((entry) => {
    const studentObjectId = studentIdMap.get(entry.studentId)!;
    return {
      updateOne: {
        filter: {
          courseId: courseObjectId,
          studentId: studentObjectId,
          date: normalizedDate,
        },
        update: {
          $set: {
            status: entry.status,
            markedBy: actorId,
          },
          $setOnInsert: {
            courseId: courseObjectId,
            studentId: studentObjectId,
            date: normalizedDate,
          },
        },
        upsert: true,
      },
    };
  });

  await AttendanceModel.bulkWrite(operations, { ordered: false });

  const records = await AttendanceModel.find({
    courseId: courseObjectId,
    studentId: { $in: studentObjectIds },
    date: normalizedDate,
  })
    .populate("studentId", "fullname username email")
    .populate("markedBy", "fullname email role")
    .lean();

  return {
    message: "Attendance marked successfully",
    records,
    summary: summarizeStatuses(records),
  };
};

/**
 * Nghiệp vụ 2 & 3: Teacher/Admin cập nhật lại attendance với giới hạn thời gian.
 * - Admin được sửa bất kỳ lúc nào; Teacher chỉ sửa trong tối đa 7 ngày, sau 1 ngày phải có reason.
 * - Ghi nhận người sửa cuối (markedBy) và trả về bản ghi populate.
 */
export const updateAttendance = async (
  attendanceId: string,
  data: UpdateAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const attendance = await AttendanceModel.findById(attendanceId);
  appAssert(attendance, NOT_FOUND, "Attendance not found");

  const course = await ensureAttendanceManagePermission(
    attendance.courseId.toString(),
    actorId,
    role
  );
  assertDateWithinCourseSchedule(
    course as { startDate: Date; endDate: Date },
    attendance.date
  );
  
  const oldStatus = attendance.status as AttendanceStatus;
  const newStatus = data.status || oldStatus;
  
  enforceTeacherEditWindow(
    attendance.date,
    role,
    oldStatus,
    newStatus,
    data.reason
  );

  if (data.status) {
    attendance.status = data.status;
  }
  attendance.markedBy = actorId;

  await attendance.save();

  return AttendanceModel.findById(attendanceId)
    .populate("studentId", "fullname username email")
    .populate("markedBy", "fullname email role")
    .lean();
};

/**
 * Nghiệp vụ 3: Admin quản lý attendance (delete bất kỳ) và Teacher delete cùng ngày.
 * - Kiểm tra quyền theo course, Teacher chỉ xóa record của chính khóa trong ngày hiện tại.
 */
export const deleteAttendance = async (
  attendanceId: string,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  appAssert(role === Role.ADMIN || role === Role.TEACHER, FORBIDDEN, "Not authorized");

  const attendance = await AttendanceModel.findById(attendanceId);
  appAssert(attendance, NOT_FOUND, "Attendance not found");

  const course = await ensureAttendanceManagePermission(
    attendance.courseId.toString(),
    actorId,
    role
  );
  assertDateWithinCourseSchedule(
    course as { startDate: Date; endDate: Date },
    attendance.date
  );

  if (role === Role.TEACHER) {
    const diff = daysDiffFromToday(attendance.date);
    appAssert(diff === 0, FORBIDDEN, "Teachers can delete only same-day records");
  }

  await attendance.deleteOne();
  return { deleted: true };
};

/**
 * Nghiệp vụ 5: Tự động tạo attendance template theo lesson/schedule.
 * - Khi lesson publish hoặc teacher yêu cầu, tạo record "notyet" mặc định cho từng student.
 */
export const generateLessonAttendanceTemplate = async (
  lessonId: string,
  options: { lessonDate?: Date; force?: boolean },
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  const lesson = await LessonModel.findById(lessonId);
  appAssert(lesson, NOT_FOUND, "Lesson not found");

  const course = await ensureAttendanceManagePermission(
    lesson.courseId.toString(),
    actorId,
    role
  );

  const baseDate = normalizeDateOnly(
    options.lessonDate || lesson.publishedAt || new Date()
  );

  if (!lesson.publishedAt && !options.force && role !== Role.ADMIN) {
    appAssert(false, BAD_REQUEST, "Lesson is not published yet");
  }

  appAssert(!isDateInFuture(baseDate), BAD_REQUEST, "Cannot create template for future date");
  assertDateWithinCourseSchedule(
    course as { startDate: Date; endDate: Date },
    baseDate
  );

  const enrollments = await EnrollmentModel.find({
    courseId: lesson.courseId,
    status: EnrollmentStatus.APPROVED,
  }).select("studentId");

  appAssert(enrollments.length > 0, NOT_FOUND, "No approved students in this course");

  const operations = enrollments.map((enrollment) => ({
    updateOne: {
      filter: {
        courseId: lesson.courseId,
        studentId: enrollment.studentId,
        date: baseDate,
      },
      update: {
        $setOnInsert: {
          courseId: lesson.courseId,
          studentId: enrollment.studentId,
          date: baseDate,
          status: AttendanceStatus.NOTYET,
        },
      },
      upsert: true,
    },
  }));

  const result = await AttendanceModel.bulkWrite(operations, { ordered: false });

  return {
    created: result.upsertedCount ?? 0,
    skipped: enrollments.length - (result.upsertedCount ?? 0),
    totalStudents: enrollments.length,
    date: baseDate,
  };
};
