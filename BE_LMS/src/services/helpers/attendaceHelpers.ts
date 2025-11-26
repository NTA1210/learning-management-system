import mongoose, { SortOrder } from 'mongoose';
import { AttendanceModel, CourseModel, EnrollmentModel, LessonModel, UserModel } from '@/models';
import appAssert from '@/utils/appAssert';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '@/constants/http';
import { Role } from '@/types';
import { EnrollmentStatus } from '@/types/enrollment.type';
import { AttendanceStatus } from '@/types/attendance.type';
import { sendMail } from '@/utils/sendMail';
import { getAttendanceWarningTemplate, getAttendanceFailedTemplate } from '@/utils/emailTemplates';
import {
  MarkAttendanceInput,
  UpdateAttendanceInput,
  ListAttendanceInput,
  ExportAttendanceInput,
  CourseStatsInput,
  StudentHistoryInput,
} from '@/validators/attendance.schemas';
const MAX_EDIT_HOURS_FOR_TEACHER = 12; // Giáo viên chỉ có thể update trong 12 giờ kể từ lúc điểm danh
const MAX_ABSENT_SESSIONS = 4; // Số buổi vắng tối đa cho phép
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
/**
 * Helper: Đếm số buổi vắng (ABSENT) của học sinh trong course
 */
export const countAbsentSessions = async (
  courseId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId
): Promise<number> => {
  const count = await AttendanceModel.countDocuments({
    courseId,
    studentId,
    status: AttendanceStatus.ABSENT,
  });
  return count;
};

/**
 * Helper: Gửi email cảnh báo hoặc false môn học khi học sinh vắng
 */
 export const sendAbsenceNotificationEmail = async (
  studentId: mongoose.Types.ObjectId,
  courseId: mongoose.Types.ObjectId,
  absentCount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Lấy thông tin học sinh và khóa học
    const [student, course] = await Promise.all([
      UserModel.findById(studentId).select("fullname email").lean(),
      CourseModel.findById(courseId).select("title").lean(),
    ]);

    if (!student || !course || !student.email) {
      return { success: false, error: "Student or course not found" };
    }

    const studentName = student.fullname || student.email;
    const courseName = course.title || "Khóa học";

    // Gửi email cảnh báo khi đạt 4 buổi vắng
    if (absentCount === MAX_ABSENT_SESSIONS) {
      const { error } = await sendMail({
        to: student.email,
        ...getAttendanceWarningTemplate(studentName, courseName, absentCount),
      });

      if (error) {
        return { success: false, error: `Failed to send warning email: ${error}` };
      }
      return { success: true };
    }
    // Gửi email false môn học khi vượt quá 4 buổi vắng
    else if (absentCount > MAX_ABSENT_SESSIONS) {
      const { error } = await sendMail({
        to: student.email,
        ...getAttendanceFailedTemplate(studentName, courseName, absentCount),
      });

      if (error) {
        return { success: false, error: `Failed to send failed email: ${error}` };
      }
      return { success: true };
    }

    // Nếu số buổi vắng < 4, không cần gửi email
    return { success: false, error: `Absent count (${absentCount}) is below threshold (${MAX_ABSENT_SESSIONS})` };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error" };
  }
};



const enforceTeacherEditWindow = (
  targetDate: Date,
  role: Role,
  createdAt: Date,
  oldStatus?: AttendanceStatus,
  newStatus?: AttendanceStatus,
  reason?: string
) => {
  // Admin có thể update bất kỳ lúc nào
  if (role === Role.ADMIN) return;

  // Giáo viên chỉ có thể update trong 12 giờ kể từ lúc điểm danh
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  appAssert(
    hoursSinceCreation <= MAX_EDIT_HOURS_FOR_TEACHER,
    FORBIDDEN,
    `Cannot modify attendance after ${MAX_EDIT_HOURS_FOR_TEACHER} hours from creation`
  );

  // Require reason when changing from ABSENT to PRESENT
  if (oldStatus === AttendanceStatus.ABSENT && newStatus === AttendanceStatus.PRESENT) {
    appAssert(!!reason, BAD_REQUEST, "Reason is required when changing from ABSENT to PRESENT");
  }
};


/**
 * Helper: Validate và update một attendance record
 */
export const updateSingleAttendanceRecord = async (
  attendanceId: string,
  data: UpdateAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role
) => {
  // Validate attendanceId
  appAssert(
    mongoose.Types.ObjectId.isValid(attendanceId),
    BAD_REQUEST,
    "Invalid attendance ID format"
  );

  // Tìm và validate attendance record
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
  //chỉ update được status absent / present
  appAssert(data.status === "present" || data.status === "absent", BAD_REQUEST, "Invalid status");
  const oldStatus = attendance.status as AttendanceStatus;
  const newStatus = data.status || oldStatus;

  // createdAt là thời điểm điểm danh ban đầu (từ timestamps)
  const createdAt = (attendance as any).createdAt || attendance.date || new Date();

  enforceTeacherEditWindow(
    attendance.date,
    role,
    createdAt,
    oldStatus,
    newStatus,
    data.reason
  );

  // Chỉ update các field được cung cấp
  if (data.status) {
    attendance.status = data.status;
  }
  attendance.markedBy = actorId;

  // save() chỉ update document hiện tại (1 record)
  await attendance.save();

  // Trả về record đã được update
  const updatedRecord = await AttendanceModel.findById(attendanceId)
    .populate("studentId", "fullname username email")
    .populate("markedBy", "fullname email role")
    .lean();

  appAssert(updatedRecord, NOT_FOUND, "Updated attendance record not found");

  return updatedRecord;
};

/**
 * Helper: Validate và update nhiều attendance records
 */
export const updateMultipleAttendanceRecords = async (
  attendanceIds: string[],
  data: UpdateAttendanceInput,
  actorId: mongoose.Types.ObjectId,
  role: Role,
  returnIdsOnly: boolean = false
) => {
  appAssert(attendanceIds.length > 0, BAD_REQUEST, "At least one attendance ID is required");
  appAssert(attendanceIds.length <= 100, BAD_REQUEST, "Cannot update more than 100 records at once");

  // Validate tất cả attendanceIds
  const validIdStrings = attendanceIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  appAssert(validIdStrings.length === attendanceIds.length, BAD_REQUEST, "Invalid attendance ID format");

  // Tìm tất cả attendance records
  const attendances = await AttendanceModel.find({
    _id: { $in: validIdStrings.map((id) => new mongoose.Types.ObjectId(id)) },
  });

  appAssert(attendances.length > 0, NOT_FOUND, "No attendance records found");
  appAssert(
    attendances.length === attendanceIds.length,
    BAD_REQUEST,
    "Some attendance records not found"
  );

  // Validate quyền và thời gian cho từng record
  const courseIds = [...new Set(attendances.map((a) => a.courseId.toString()))];
  const courses = await Promise.all(
    courseIds.map((courseId) => ensureAttendanceManagePermission(courseId, actorId, role))
  );

  const courseMap = new Map(
    courses.map((course, index) => [courseIds[index], course])
  );

  // Track records sẽ được update (có thay đổi status hoặc markedBy)
  const recordsToUpdate: Array<{
    attendance: typeof attendances[0];
    oldStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    willChange: boolean; // Có thay đổi status không
  }> = [];
  const errors: string[] = [];

  for (const attendance of attendances) {
    try {
      const course = courseMap.get(attendance.courseId.toString());
      if (!course) {
        errors.push(`Course not found for attendance ${attendance._id}`);
        continue;
      }

      assertDateWithinCourseSchedule(
        course as { startDate: Date; endDate: Date },
        attendance.date
      );
      //chỉ update được status absent / present
      appAssert(data.status === "present" || data.status === "absent", BAD_REQUEST, "Invalid status");
      const oldStatus = attendance.status as AttendanceStatus;
      const newStatus = data.status || oldStatus;
      
      // Kiểm tra xem record này có thay đổi status không
      // Nếu không có status mới trong data, vẫn update markedBy nhưng không coi là "thay đổi"
      const willChange = data.status ? oldStatus !== newStatus : false;

      const createdAt = (attendance as any).createdAt || attendance.date || new Date();

      enforceTeacherEditWindow(
        attendance.date,
        role,
        createdAt,
        oldStatus,
        newStatus,
        data.reason
      );

      recordsToUpdate.push({
        attendance,
        oldStatus,
        newStatus,
        willChange,
      });
    } catch (error: any) {
      errors.push(`Attendance ${attendance._id}: ${error.message}`);
    }
  }

  appAssert(recordsToUpdate.length > 0, BAD_REQUEST, `All records failed validation: ${errors.join(", ")}`);

  // Tách records sẽ thay đổi status và không thay đổi
  const recordsThatWillChange = recordsToUpdate.filter((r) => r.willChange);
  const recordsThatWontChange = recordsToUpdate.filter((r) => !r.willChange);

  // Sử dụng bulkWrite để update từng record riêng biệt
  // Điều này linh hoạt hơn khi có nhiều studentIds khác nhau
  const operations = recordsToUpdate.map((r) => {
    const updateData: any = {
      markedBy: actorId,
    };
    if (data.status) {
      updateData.status = r.newStatus; // Sử dụng newStatus đã được validate
    }

    return {
      updateOne: {
        filter: {
          _id: r.attendance._id,
        },
        update: {
          $set: updateData,
        },
      },
    };
  });

  const result = await AttendanceModel.bulkWrite(operations, { ordered: false });

  // CHỈ trả về những records ĐƯỢC CHỌN ĐỂ UPDATE (không phải tất cả học sinh trong class)
  // Sử dụng dữ liệu đã có từ validation, KHÔNG query lại từ DB
  // Trả về TẤT CẢ records được chọn (kể cả không thay đổi status)
  let updatedRecords: any[] = [];
  let updatedIds: string[] = [];

  if (recordsToUpdate.length > 0) {
    // Populate thông tin cho TẤT CẢ records được chọn (không chỉ records thay đổi)
    const studentIds = [...new Set(recordsToUpdate.map((r) => r.attendance.studentId.toString()))];
    const students = await UserModel.find({
      _id: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("fullname username email")
      .lean();

    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    // Lấy thông tin markedBy (actor) - chỉ query 1 lần
    const actorInfo = await UserModel.findById(actorId)
      .select("fullname email role")
      .lean();

    if (returnIdsOnly) {
      // Chỉ trả về IDs của những records được chọn
      updatedIds = recordsToUpdate.map((r) => (r.attendance._id as mongoose.Types.ObjectId).toString());
    } else {
      // Build response từ dữ liệu đã có, KHÔNG query lại từ DB
      // Trả về TẤT CẢ records được chọn (kể cả không thay đổi status)
      updatedRecords = recordsToUpdate.map((r) => {
        const attendance = r.attendance;
        const student = studentMap.get(attendance.studentId.toString());
        
        return {
          _id: attendance._id as mongoose.Types.ObjectId,
          courseId: attendance.courseId,
          studentId: {
            _id: student?._id,
            fullname: student?.fullname,
            username: student?.username,
            email: student?.email,
          },
          date: attendance.date,
          status: r.newStatus, // Status mới (hoặc giữ nguyên nếu không có status mới)
          markedBy: {
            _id: actorInfo?._id,
            fullname: actorInfo?.fullname,
            email: actorInfo?.email,
            role: actorInfo?.role,
          },
          createdAt: (attendance as any).createdAt,
          updatedAt: new Date(), // Thời gian update mới
        };
      });
    }
  }

  return {
    updated: result.modifiedCount, // Số records thực sự được update từ bulkWrite
    total: recordsToUpdate.length, // Tổng số records được chọn
    skipped: recordsToUpdate.length - result.modifiedCount, // Số records không thay đổi (status giống nhau)
    ...(returnIdsOnly ? { updatedIds } : { records: updatedRecords }), // CHỈ trả về records được CHỌN, không phải tất cả học sinh
    errors: errors.length > 0 ? errors : undefined,
  };
};
