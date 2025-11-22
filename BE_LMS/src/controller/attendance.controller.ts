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

