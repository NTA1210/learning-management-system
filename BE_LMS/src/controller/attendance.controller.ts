import { OK, CREATED } from "@/constants/http";
import { catchErrors } from "@/utils/asyncHandler";
import {
  AttendanceIdParamSchema,
  CourseIdParamSchema,
  LessonIdParamSchema,
  StudentIdParamSchema,
  courseStatsQuerySchema,
  exportAttendanceQuerySchema,
  lessonTemplateSchema,
  listAttendanceQuerySchema,
  markAttendanceSchema,
  selfHistoryQuerySchema,
  studentHistoryQuerySchema,
  updateAttendanceSchema,
} from "@/validators/attendance.schemas";
import {
  exportAttendanceReport,
  getCourseAttendanceStats,
  getSelfAttendanceHistory,
  getStudentAttendanceHistory,
  getStudentAttendanceStats,
  listAttendances,
  markAttendance,
  updateAttendance,
  deleteAttendance,
  generateLessonAttendanceTemplate,
} from "@/services/attendance.service";



/**
 * API: List attendance cho Admin/Teacher với summary (nghiệp vụ 3 & 7).
 */
export const listAttendanceController = catchErrors(async (req, res) => {
  const query = listAttendanceQuerySchema.parse(req.query);
  const result = await listAttendances(query, req.userId, req.role);

  return res.success(OK, {
    data: result.records,
    pagination: result.pagination,
    summary: result.summary,
    message: "Attendance list fetched",
  });
});

/**
 * API: Teacher/Admin xem lịch sử attendance của học viên (nghiệp vụ 4).
 */
export const studentAttendanceHistoryController = catchErrors(async (req, res) => {
  const { studentId } = StudentIdParamSchema.parse(req.params);
  const query = studentHistoryQuerySchema.parse(req.query);
  const result = await getStudentAttendanceHistory(studentId, query, req.userId, req.role);

  return res.success(OK, {
    data: result.records,
    pagination: result.pagination,
    summary: result.summary,
    message: "Student attendance history fetched",
  });
});

/**
 * API: Student xem lịch sử attendance của chính mình (nghiệp vụ 4).
 */
export const selfAttendanceHistoryController = catchErrors(async (req, res) => {
  const query = selfHistoryQuerySchema.parse(req.query);
  const result = await getSelfAttendanceHistory(req.userId, query);

  return res.success(OK, {
    data: result.records,
    pagination: result.pagination,
    summary: result.summary,
    message: "Self attendance history fetched",
  });
});


/**
 * API: Export attendance report (nghiệp vụ 6).
 */
export const exportAttendanceController = catchErrors(async (req, res) => {
  const query = exportAttendanceQuerySchema.parse(req.query);
  const result = await exportAttendanceReport(query, req.userId, req.role);

  return res.success(OK, {
    data: result,
    message: "Attendance export ready",
  });
});

/**
 * API: Thống kê attendance theo course (nghiệp vụ 7).
 */
export const courseStatsController = catchErrors(async (req, res) => {
  const { courseId } = CourseIdParamSchema.parse(req.params);
  const query = courseStatsQuerySchema.parse(req.query);
  const result = await getCourseAttendanceStats(courseId, query, req.userId, req.role);

  return res.success(OK, {
    data: result,
    message: "Course attendance stats generated",
  });
});

/**
 * API: Thống kê attendance theo học viên trong course (nghiệp vụ 7).
 */
export const studentStatsController = catchErrors(async (req, res) => {
  const { courseId } = CourseIdParamSchema.parse(req.params);
  const { studentId } = StudentIdParamSchema.parse(req.params);
  const query = courseStatsQuerySchema.parse(req.query);
  const result = await getStudentAttendanceStats(courseId, studentId, query, req.userId, req.role);

  return res.success(OK, {
    data: result,
    message: "Student attendance stats generated",
  });
});

/**
 * API: Teacher/Admin đánh dấu attendance cho course theo nghiệp vụ 1.
 */
export const markAttendanceController = catchErrors(async (req, res) => {
  const payload = markAttendanceSchema.parse(req.body);
  const result = await markAttendance(payload, req.userId, req.role);

  return res.success(CREATED, {
    data: result,
    message: "Attendance recorded",
  });
})
/**
 * API: Teacher/Admin cập nhật attendance theo nghiệp vụ 2/3.
 */
export const updateAttendanceController = catchErrors(async (req, res) => {
  const { attendanceId } = AttendanceIdParamSchema.parse(req.params);
  const payload = updateAttendanceSchema.parse(req.body);
  const result = await updateAttendance(attendanceId, payload, req.userId, req.role);

  return res.success(OK, {
    data: result,
    message: "Attendance updated",
  });
});

/**
 * API: Admin delete attendance (Teacher chỉ delete same-day) theo nghiệp vụ 3.
 */
export const deleteAttendanceController = catchErrors(async (req, res) => {
  const { attendanceId } = AttendanceIdParamSchema.parse(req.params);
  const result = await deleteAttendance(attendanceId, req.userId, req.role);

  return res.success(OK, {
    data: result,
    message: "Attendance deleted",
  });
});
/**
 * API: Tạo attendance template theo lesson (nghiệp vụ 5).
 */
export const lessonTemplateController = catchErrors(async (req, res) => {
  const { lessonId } = LessonIdParamSchema.parse(req.params);
  const payload = lessonTemplateSchema.parse(req.body);
  const result = await generateLessonAttendanceTemplate(
    lessonId,
    payload,
    req.userId,
    req.role
  );

  return res.success(CREATED, {
    data: result,
    message: "Attendance template generated",
  });
});

