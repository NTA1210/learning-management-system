import { Router } from "express";
import {
  courseStatsController,
  exportAttendanceController,
  listAttendanceController,
  selfAttendanceHistoryController,
  studentAttendanceHistoryController,
  studentStatsController,
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

