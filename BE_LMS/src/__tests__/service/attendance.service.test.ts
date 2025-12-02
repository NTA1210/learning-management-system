// Attendance Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";
import { AttendanceStatus } from "@/types/attendance.type";

// Mock all models before importing services
jest.mock("@/models/attendance.model");
jest.mock("@/models/course.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/user.model");
jest.mock("@/models/lesson.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/date");
jest.mock("@/utils/sendMail", () => ({
  sendMail: jest.fn().mockResolvedValue({ data: { id: "mocked" } }),
}));
jest.mock("@/services/helpers/attendaceHelpers", () => ({
  normalizeDateOnly: jest.fn((date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }),
  daysDiffFromToday: jest.fn((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }),
  assertDateWithinCourseSchedule: jest.fn(),
  clampDateRangeToCourse: jest.fn((course: any, from?: Date, to?: Date) => ({
    from: from || course.startDate,
    to: to || course.endDate,
  })),
  buildDateRangeFilter: jest.fn((from?: Date, to?: Date) => {
    if (!from && !to) return null;
    const filter: any = {};
    if (from) filter.$gte = from;
    if (to) filter.$lte = to;
    return filter;
  }),
  ensureAttendanceManagePermission: jest.fn(),
  verifyStudentsBelongToCourse: jest.fn(),
  countAbsentSessions: jest.fn(),
  sendAbsenceNotificationEmail: jest.fn(),
  updateSingleAttendanceRecord: jest.fn(),
  updateMultipleAttendanceRecords: jest.fn(),
}));

// Import models for mocking
import AttendanceModel from "@/models/attendance.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import UserModel from "@/models/user.model";
import LessonModel from "@/models/lesson.model";
import appAssert from "@/utils/appAssert";
import { isDateInFuture } from "@/utils/date";
import * as attendanceHelpers from "@/services/helpers/attendaceHelpers";

// Import services
import {
  listAttendances,
  getStudentAttendanceHistory,
  getSelfAttendanceHistory,
  exportAttendanceReport,
  getCourseAttendanceStats,
  getStudentAttendanceStats,
  markAttendance,
  sendAbsenceNotificationEmails,
  updateAttendance,
  deleteAttendance,
} from "@/services/attendance.service";
import { MarkAttendanceInput } from "@/validators/attendance.schemas";

describe("📋 Attendance Service Unit Tests", () => {
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let course: any;
  let attendance: any;

  beforeEach(() => {
    // Create mock data
    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      fullname: "Admin User",
      email: "admin@test.com",
      role: Role.ADMIN,
    };

    teacherUser = {
      _id: new mongoose.Types.ObjectId(),
      fullname: "Teacher User",
      email: "teacher@test.com",
      role: Role.TEACHER,
    };

    studentUser = {
      _id: new mongoose.Types.ObjectId(),
      fullname: "Student User",
      email: "student@test.com",
      role: Role.STUDENT,
    };

    course = {
      _id: new mongoose.Types.ObjectId(),
      title: "Test Course",
      code: "TC001",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      teacherIds: [teacherUser._id],
    };

    attendance = {
      _id: new mongoose.Types.ObjectId(),
      courseId: course._id,
      studentId: studentUser._id,
      date: new Date("2024-06-15"),
      status: AttendanceStatus.PRESENT,
      markedBy: teacherUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset all mocks
    jest.clearAllMocks();

    // appAssert: throw Error(message) when condition falsy
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });

    // Default mocks
    (isDateInFuture as jest.Mock).mockReturnValue(false);
    (attendanceHelpers.ensureAttendanceManagePermission as jest.Mock).mockResolvedValue(course);
    (attendanceHelpers.verifyStudentsBelongToCourse as jest.Mock).mockResolvedValue(undefined);
    (attendanceHelpers.assertDateWithinCourseSchedule as jest.Mock).mockReturnValue(undefined);
    (attendanceHelpers.countAbsentSessions as jest.Mock).mockResolvedValue(0);
    (attendanceHelpers.sendAbsenceNotificationEmail as jest.Mock).mockResolvedValue({
      success: true,
      message: "Email sent",
    });
  });

  describe("listAttendances", () => {
    it("should return paginated attendance records for admin", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);
      (AttendanceModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: AttendanceStatus.PRESENT, count: 1 },
      ]);

      const result = await listAttendances(
        { page: 1, limit: 10 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.records).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.summary[AttendanceStatus.PRESENT]).toBe(1);
    });

    it("should filter by courseId", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);
      (AttendanceModel.aggregate as jest.Mock).mockResolvedValue([]);

      await listAttendances(
        { page: 1, limit: 10, courseId: course._id.toString() },
        teacherUser._id,
        Role.TEACHER
      );

      expect(attendanceHelpers.ensureAttendanceManagePermission).toHaveBeenCalled();
    });

    it("should throw error when student tries to list", async () => {
      await expect(
        listAttendances({ page: 1, limit: 10 }, studentUser._id, Role.STUDENT)
      ).rejects.toThrow("Not authorized");
    });

    it("should apply studentId, teacherId, status, date, and sort filters", async () => {
      const studentId = new mongoose.Types.ObjectId().toString();
      const teacherId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        sort: jest.fn(function (this: any, sortArg) {
          expect(sortArg).toEqual({ createdAt: 1 });
          return this;
        }),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.studentId.toString()).toBe(studentId);
        expect(filter.markedBy.toString()).toBe(teacherId);
        expect(filter.status).toBe(AttendanceStatus.PRESENT);
        expect(filter.date).toBeDefined();
        return mockQuery;
      });
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);
      (AttendanceModel.aggregate as jest.Mock).mockResolvedValue([]);

      await listAttendances(
        {
          page: 1,
          limit: 10,
          courseId: course._id.toString(),
          studentId,
          teacherId,
          status: AttendanceStatus.PRESENT,
          from: new Date("2024-06-01"),
          to: new Date("2024-06-30"),
          sortBy: "createdAt",
          sortOrder: "asc",
        },
        adminUser._id,
        Role.ADMIN
      );
    });
  });

  describe("getStudentAttendanceHistory", () => {
    it("should return student attendance history for admin", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getStudentAttendanceHistory(
        studentUser._id.toString(),
        { page: 1, limit: 10 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.records).toHaveLength(1);
      expect(result.summary.total).toBe(1);
    });

    it("should throw error when student tries to view other student history", async () => {
      const otherStudentId = new mongoose.Types.ObjectId().toString();
      await expect(
        getStudentAttendanceHistory(
          otherStudentId,
          { page: 1, limit: 10 },
          studentUser._id,
          Role.STUDENT
        )
      ).rejects.toThrow("Students can only view their own attendance");
    });

    it("should require courseId for teacher", async () => {
      await expect(
        getStudentAttendanceHistory(
          studentUser._id.toString(),
          { page: 1, limit: 10 },
          teacherUser._id,
          Role.TEACHER
        )
      ).rejects.toThrow("courseId is required for teachers");
    });

    it("should clamp date range and verify students for teacher requests", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.courseId.toString()).toBe(course._id.toString());
        expect(filter.status).toBe(AttendanceStatus.PRESENT);
        expect(filter.date).toBeDefined();
        return mockQuery;
      });
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await getStudentAttendanceHistory(
        studentUser._id.toString(),
        {
          page: 1,
          limit: 10,
          courseId: course._id.toString(),
          status: AttendanceStatus.PRESENT,
          from: new Date("2024-06-01"),
          to: new Date("2024-06-30"),
        },
        teacherUser._id,
        Role.TEACHER
      );

      expect(attendanceHelpers.verifyStudentsBelongToCourse).toHaveBeenCalledWith(
        course._id.toString(),
        [studentUser._id.toString()]
      );
    });

    it("should handle admin courseId flow without student verification", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);

      await getStudentAttendanceHistory(
        studentUser._id.toString(),
        {
          page: 1,
          limit: 10,
          courseId: course._id.toString(),
        },
        adminUser._id,
        Role.ADMIN
      );

      expect(attendanceHelpers.verifyStudentsBelongToCourse).not.toHaveBeenCalled();
    });
  });

  describe("getSelfAttendanceHistory", () => {
    it("should return self attendance history", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);
      (AttendanceModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getSelfAttendanceHistory(studentUser._id, {
        page: 1,
        limit: 10,
      });

      expect(result.records).toHaveLength(1);
    });
  });

  describe("exportAttendanceReport", () => {
    it("should export JSON format", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await exportAttendanceReport(
        { page: 1, limit: 10, format: "json", courseId: course._id.toString() },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.format).toBe("json");
      expect(result.data).toHaveLength(1);
    });

    it("should export CSV format", async () => {
      const attendanceWithPopulated = {
        ...attendance,
        studentId: { fullname: "Student, User" },
        courseId: { title: new Date("2024-06-15") as any },
        markedBy: { fullname: "Teacher User" },
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendanceWithPopulated]),
      };
      (AttendanceModel.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await exportAttendanceReport(
        { page: 1, limit: 10, format: "csv", courseId: course._id.toString() },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.format).toBe("csv");
      expect(result.csv).toContain("\"Student, User\"");
      expect(result.csv).toContain("2024-06-15");
    });

    it("should escape fallback values in CSV rows", async () => {
      const records = [
        {
          studentId: { username: "student_only_username" },
          courseId: { title: "Course Title" },
          date: "2024-07-01",
          status: AttendanceStatus.ABSENT,
          markedBy: { email: "teacher@test.com" },
        },
        {
          studentId: undefined,
          courseId: undefined,
          date: new Date("2024-07-02"),
          status: AttendanceStatus.PRESENT,
          markedBy: {},
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });

      const result = await exportAttendanceReport(
        { page: 1, limit: 10, format: "csv", courseId: course._id.toString() },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.csv).toContain("student_only_username");
      expect(result.csv).toContain("2024-07-02");
      expect(result.csv).toContain(",teacher@test.com,");
    });
  });

  describe("getCourseAttendanceStats", () => {
    it("should return course attendance stats", async () => {
      const records = [
        {
          studentId: studentUser._id,
          status: AttendanceStatus.PRESENT,
          date: new Date("2024-06-15"),
        },
        {
          studentId: studentUser._id,
          status: AttendanceStatus.ABSENT,
          date: new Date("2024-06-16"),
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([studentUser]),
      });

      const result = await getCourseAttendanceStats(
        course._id.toString(),
        { threshold: 20 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.courseId).toBe(course._id.toString());
      expect(result.studentStats).toHaveLength(1);
      expect(result.studentStats[0].attendanceRate).toBe(50);
    });

    it("should handle course with no attendance records", async () => {
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await getCourseAttendanceStats(
        course._id.toString(),
        { threshold: 20 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.studentStats).toHaveLength(0);
      expect(result.totalRecords).toBe(0);
    });

    it("should not set date filter when helper returns undefined", async () => {
      const buildMock = attendanceHelpers.buildDateRangeFilter as jest.Mock;
      buildMock.mockImplementationOnce(() => undefined);
      (AttendanceModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.date).toBeUndefined();
        return {
          select: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
      });
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      await getCourseAttendanceStats(
        course._id.toString(),
        { threshold: 20 },
        adminUser._id,
        Role.ADMIN
      );
    });

    it("should compute zero attendance rate when all sessions are unmarked", async () => {
      const records = [
        {
          studentId: studentUser._id,
          status: AttendanceStatus.NOTYET,
          date: new Date("2024-06-15"),
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await getCourseAttendanceStats(
        course._id.toString(),
        {} as any,
        adminUser._id,
        Role.ADMIN
      );

      expect(result.studentStats[0].attendanceRate).toBe(0);
      expect(result.studentStats[0].student).toBeNull();
    });

    it("should compute longest absent streak for consecutive absences", async () => {
      const records = [
        {
          studentId: studentUser._id,
          status: AttendanceStatus.ABSENT,
          date: new Date("2024-06-15"),
        },
        {
          studentId: studentUser._id,
          status: AttendanceStatus.ABSENT,
          date: new Date("2024-06-16"),
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([studentUser]),
      });

      const result = await getCourseAttendanceStats(
        course._id.toString(),
        { threshold: 50 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.studentStats[0].longestAbsentStreak).toBe(2);
    });
  });

  describe("getStudentAttendanceStats", () => {
    it("should return student attendance stats", async () => {
      const records = [
        {
          studentId: studentUser._id,
          status: AttendanceStatus.PRESENT,
          date: new Date("2024-06-15"),
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(studentUser),
      });

      const result = await getStudentAttendanceStats(
        course._id.toString(),
        studentUser._id.toString(),
        { threshold: 20 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.studentId).toBe(studentUser._id.toString());
      expect(result.attendanceRate).toBe(100);
    });

    it("should handle student stats with no marked sessions and missing date filter", async () => {
      const buildMock = attendanceHelpers.buildDateRangeFilter as jest.Mock;
      buildMock.mockImplementationOnce(() => undefined);
      const records = [
        {
          studentId: studentUser._id,
          status: AttendanceStatus.NOTYET,
          date: new Date("2024-06-15"),
        },
      ];
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(records),
      });
      (UserModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await getStudentAttendanceStats(
        course._id.toString(),
        studentUser._id.toString(),
        { threshold: 20 },
        adminUser._id,
        Role.ADMIN
      );

      expect(result.attendanceRate).toBe(0);
      expect(result.student).toBeNull();
    });
  });

  describe("markAttendance", () => {
    it("should mark attendance successfully", async () => {
      const payload: MarkAttendanceInput = {
        courseId: course._id.toString(),
        date: new Date("2024-06-15"),
        entries: [
          {
            studentId: studentUser._id.toString(),
            status: AttendanceStatus.PRESENT as MarkAttendanceInput["entries"][number]["status"],
          },
        ],
      };

      (AttendanceModel.bulkWrite as jest.Mock).mockResolvedValue({});
      (AttendanceModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([attendance]),
      });

      const result = await markAttendance(payload, teacherUser._id, Role.TEACHER);

      expect(result.message).toBe("Attendance marked successfully");
      expect(result.records).toHaveLength(1);
    });

    it("should throw error for future date", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      (isDateInFuture as jest.Mock).mockReturnValue(true);

      const payload: MarkAttendanceInput = {
        courseId: course._id.toString(),
        date: futureDate,
        entries: [
          {
            studentId: studentUser._id.toString(),
            status: AttendanceStatus.PRESENT as MarkAttendanceInput["entries"][number]["status"],
          },
        ],
      };

      await expect(
        markAttendance(payload, teacherUser._id, Role.TEACHER)
      ).rejects.toThrow("Cannot mark future date");
    });

    it("should throw error for invalid status", async () => {
      const payload: MarkAttendanceInput = {
        courseId: course._id.toString(),
        date: new Date("2024-06-15"),
        entries: [
          {
            studentId: studentUser._id.toString(),
            status: AttendanceStatus.NOTYET as unknown as MarkAttendanceInput["entries"][number]["status"],
          },
        ],
      };

      await expect(
        markAttendance(payload, teacherUser._id, Role.TEACHER)
      ).rejects.toThrow("Invalid status");
    });
  });

  describe("sendAbsenceNotificationEmails", () => {
    it("should send absence notification emails", async () => {
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([studentUser]),
      });
      (attendanceHelpers.countAbsentSessions as jest.Mock).mockResolvedValue(5);
      (attendanceHelpers.sendAbsenceNotificationEmail as jest.Mock).mockResolvedValue({
        success: true,
        message: "Email sent",
      });

      const result = await sendAbsenceNotificationEmails(
        course._id.toString(),
        [studentUser._id.toString()],
        adminUser._id,
        Role.ADMIN
      );

      expect(result.total).toBe(1);
      expect(result.success).toBe(1);
    });

    it("should throw error for empty studentIds", async () => {
      await expect(
        sendAbsenceNotificationEmails(
          course._id.toString(),
          [],
          adminUser._id,
          Role.ADMIN
        )
      ).rejects.toThrow("At least one student ID is required");
    });

    it("should throw error for more than 100 students", async () => {
      const studentIds = Array.from({ length: 101 }, () =>
        new mongoose.Types.ObjectId().toString()
      );
      await expect(
        sendAbsenceNotificationEmails(
          course._id.toString(),
          studentIds,
          adminUser._id,
          Role.ADMIN
        )
      ).rejects.toThrow("Cannot send emails to more than 100 students at once");
    });

    it("should fallback to email when student fullname missing and capture failures", async () => {
      (UserModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: studentUser._id, email: "no-name@test.com", fullname: undefined },
        ]),
      });
      (attendanceHelpers.countAbsentSessions as jest.Mock).mockResolvedValue(2);
      (attendanceHelpers.sendAbsenceNotificationEmail as jest.Mock).mockResolvedValue({
        success: false,
        error: "Mailer error",
      });

      const result = await sendAbsenceNotificationEmails(
        course._id.toString(),
        [studentUser._id.toString()],
        adminUser._id,
        Role.ADMIN
      );

      expect(result.failed).toBe(1);
      expect(result.results[0].studentName).toBe("no-name@test.com");
      expect(result.results[0].success).toBe(false);
    });
  });

  describe("updateAttendance", () => {
    it("should update single attendance record", async () => {
      const updatedRecord = { ...attendance, status: AttendanceStatus.ABSENT };
      (attendanceHelpers.updateSingleAttendanceRecord as jest.Mock).mockResolvedValue(updatedRecord);

      const result = await updateAttendance(
        attendance._id.toString(),
        { status: AttendanceStatus.ABSENT } as any,
        teacherUser._id,
        Role.TEACHER
      );

      expect(result).toEqual(updatedRecord);
    });

    it("should update multiple attendance records", async () => {
      const attendanceIds = [
        attendance._id.toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      (attendanceHelpers.updateMultipleAttendanceRecords as jest.Mock).mockResolvedValue({
        updated: 2,
        total: 2,
      });

      const result = await updateAttendance(
        attendanceIds,
        { status: AttendanceStatus.PRESENT } as any,
        adminUser._id,
        Role.ADMIN
      );

      expect(result.updated).toBe(2);
    });
  });

  describe("deleteAttendance", () => {
    it("should delete single attendance record", async () => {
      (AttendanceModel.find as jest.Mock).mockResolvedValue([attendance]);
      (AttendanceModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await deleteAttendance(
        attendance._id.toString(),
        adminUser._id,
        Role.ADMIN
      );

      expect(result.deleted).toBe(true);
    });

    it("should delete multiple attendance records", async () => {
      const attendanceIds = [
        attendance._id.toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      (AttendanceModel.find as jest.Mock).mockResolvedValue([
        attendance,
        { ...attendance, _id: new mongoose.Types.ObjectId() },
      ]);
      (AttendanceModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });

      const result = await deleteAttendance(attendanceIds, adminUser._id, Role.ADMIN);

      expect(result.deleted).toBe(2);
    });

    it("should throw error for empty attendanceIds", async () => {
      await expect(
        deleteAttendance([], adminUser._id, Role.ADMIN)
      ).rejects.toThrow("At least one attendance ID is required");
    });

    it("should throw error when attendance not found", async () => {
      (AttendanceModel.find as jest.Mock).mockResolvedValue([]);

      await expect(
        deleteAttendance(attendance._id.toString(), adminUser._id, Role.ADMIN)
      ).rejects.toThrow("No attendance records found");
    });

    it("should prevent teacher from deleting past records", async () => {
      (AttendanceModel.find as jest.Mock).mockResolvedValue([attendance]);
      (attendanceHelpers.daysDiffFromToday as jest.Mock).mockImplementationOnce(() => 1);

      await expect(
        deleteAttendance(attendance._id.toString(), teacherUser._id, Role.TEACHER)
      ).rejects.toThrow("Teachers can delete only same-day records");
    });

    it("should include errors when some records fail validation", async () => {
      const failingAttendance = { ...attendance, _id: new mongoose.Types.ObjectId() };
      const passingAttendance = { ...attendance, _id: new mongoose.Types.ObjectId() };
      (AttendanceModel.find as jest.Mock).mockResolvedValue([
        failingAttendance,
        passingAttendance,
      ]);
      const ensureMock = attendanceHelpers.ensureAttendanceManagePermission as jest.Mock;
      ensureMock
        .mockImplementationOnce(() => {
          throw new Error("Forbidden");
        })
        .mockImplementation(() => course);

      (AttendanceModel.deleteMany as jest.Mock).mockResolvedValue({});

      const result = await deleteAttendance(
        [failingAttendance._id.toString(), passingAttendance._id.toString()],
        adminUser._id,
        Role.ADMIN
      );

      expect(result.errors).toBeDefined();
      expect(result.deleted).toBe(0);
      expect(result.deletedIds).toHaveLength(1);

      ensureMock.mockImplementation(() => course);
    });

    it("should return deleted false when deleteOne does not remove record", async () => {
      (AttendanceModel.find as jest.Mock).mockResolvedValue([attendance]);
      (AttendanceModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await deleteAttendance(
        attendance._id.toString(),
        adminUser._id,
        Role.ADMIN
      );

      expect(result.deleted).toBe(false);
      expect(result.record).toBeTruthy();
    });
  });
});


