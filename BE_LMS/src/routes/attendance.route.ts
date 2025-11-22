import { Router } from "express";
import {
  courseStatsController,
  exportAttendanceController,
  listAttendanceController,
  selfAttendanceHistoryController,
  studentAttendanceHistoryController,
  studentStatsController,
  markAttendanceController,
  lessonTemplateController,
  updateAttendanceController,
  deleteAttendanceController,
} from "@/controller/attendance.controller";
import authorize from "@/middleware/authorize";
import { Role } from "@/types";

const attendanceRoutes = Router();


// Nghiệp vụ 3 & 7: Danh sách + summary attendance quản trị
attendanceRoutes.get("/", authorize(Role.TEACHER, Role.ADMIN), listAttendanceController);

// Nghiệp vụ 6: Export báo cáo attendance
attendanceRoutes.get("/export", authorize(Role.TEACHER, Role.ADMIN), exportAttendanceController);

// Nghiệp vụ 4: Student xem lịch sử của bản thân
attendanceRoutes.get("/self", selfAttendanceHistoryController);

// Nghiệp vụ 4: Teacher/Admin xem lịch sử theo học viên
attendanceRoutes.get(
  "/students/:studentId",
  authorize(Role.TEACHER, Role.ADMIN),
  studentAttendanceHistoryController
);

// Nghiệp vụ 7: Thống kê attendance toàn course
attendanceRoutes.get(
  "/courses/:courseId/stats",
  authorize(Role.TEACHER, Role.ADMIN),
  courseStatsController
);

// Nghiệp vụ 7: Thống kê attendance theo từng học viên trong course
attendanceRoutes.get(
  "/courses/:courseId/students/:studentId/stats",
  authorize(Role.TEACHER, Role.ADMIN),
  studentStatsController
);


export default attendanceRoutes;

// Nghiệp vụ 1: Teacher/Admin đánh dấu attendance
attendanceRoutes.post("/", authorize(Role.TEACHER, Role.ADMIN), markAttendanceController);
// Nghiệp vụ 5: Tạo template attendance theo lesson/schedule
attendanceRoutes.post(
  "/lessons/:lessonId/template",
  authorize(Role.TEACHER, Role.ADMIN),
  lessonTemplateController
);

// Nghiệp vụ 2/3: Update attendance
attendanceRoutes.patch(
  "/:attendanceId",
  authorize(Role.TEACHER, Role.ADMIN),
  updateAttendanceController
);

// Nghiệp vụ 3: Admin delete (Teacher same-day delete)
attendanceRoutes.delete(
  "/:attendanceId",
  authorize(Role.ADMIN, Role.TEACHER),
  deleteAttendanceController
);
