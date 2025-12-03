// Attendance Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";
import { AttendanceStatus } from "@/types/attendance.type";

// Mock MongoMemoryServer to avoid timeout in unit tests
jest.mock("mongodb-memory-server", () => ({
  MongoMemoryServer: jest.fn().mockImplementation(() => ({
    getUri: jest.fn().mockResolvedValue("mongodb://localhost:27017/test"),
    stop: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock mongoose connection
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(actualMongoose),
    connection: {
      ...actualMongoose.connection,
      readyState: 1,
      collections: {},
      dropDatabase: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock all services before importing controller
jest.mock("@/services/attendance.service", () => ({
  listAttendances: jest.fn(),
  getStudentAttendanceHistory: jest.fn(),
  getSelfAttendanceHistory: jest.fn(),
  exportAttendanceReport: jest.fn(),
  getCourseAttendanceStats: jest.fn(),
  getStudentAttendanceStats: jest.fn(),
  markAttendance: jest.fn(),
  sendAbsenceNotificationEmails: jest.fn(),
  updateAttendance: jest.fn(),
  deleteAttendance: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/attendance.schemas", () => ({
  listAttendanceQuerySchema: { parse: jest.fn() },
  studentHistoryQuerySchema: { parse: jest.fn() },
  selfHistoryQuerySchema: { parse: jest.fn() },
  exportAttendanceQuerySchema: { parse: jest.fn() },
  courseStatsQuerySchema: { parse: jest.fn() },
  markAttendanceSchema: { parse: jest.fn() },
  sendAbsenceNotificationSchema: { parse: jest.fn() },
  updateAttendanceSchema: { parse: jest.fn() },
  deleteAttendanceSchema: { parse: jest.fn() },
  AttendanceIdParamSchema: { parse: jest.fn() },
  CourseIdParamSchema: { parse: jest.fn() },
  StudentIdParamSchema: { parse: jest.fn() },
}));

// Import controller and services
import {
  listAttendanceController,
  studentAttendanceHistoryController,
  selfAttendanceHistoryController,
  exportAttendanceController,
  courseStatsController,
  studentStatsController,
  markAttendanceController,
  sendAbsenceNotificationController,
  updateAttendanceController,
  deleteAttendanceController,
} from "@/controller/attendance.controller";
import * as attendanceService from "@/services/attendance.service";
import * as attendanceSchemas from "@/validators/attendance.schemas";

describe("📋 Attendance Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      userId: new mongoose.Types.ObjectId(),
      role: Role.ADMIN,
      query: {},
      params: {},
      body: {},
    };
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("listAttendanceController", () => {
    it("should call listAttendances service with correct parameters", async () => {
      const mockRecords = [{ _id: "1", status: AttendanceStatus.PRESENT }];
      (attendanceService.listAttendances as jest.Mock).mockResolvedValue({
        records: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
      });
      (attendanceSchemas.listAttendanceQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.listAttendances).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
        message: "Attendance list fetched",
      });
    });

    it.skip("should handle validation errors", async () => {
      const validationError = new Error("Invalid query parameters");
      (attendanceSchemas.listAttendanceQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await listAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("studentAttendanceHistoryController", () => {
    it("should call getStudentAttendanceHistory service with correct parameters", async () => {
      const studentId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { studentId };
      const mockRecords = [{ _id: "1", status: AttendanceStatus.PRESENT }];
      (attendanceService.getStudentAttendanceHistory as jest.Mock).mockResolvedValue({
        records: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
      });
      (attendanceSchemas.StudentIdParamSchema.parse as jest.Mock).mockReturnValue({ studentId });
      (attendanceSchemas.studentHistoryQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await studentAttendanceHistoryController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.getStudentAttendanceHistory).toHaveBeenCalledWith(
        studentId,
        { page: 1, limit: 10 },
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
        message: "Student attendance history fetched",
      });
    });
  });

  describe("selfAttendanceHistoryController", () => {
    it("should call getSelfAttendanceHistory service with correct parameters", async () => {
      const mockRecords = [{ _id: "1", status: AttendanceStatus.PRESENT }];
      (attendanceService.getSelfAttendanceHistory as jest.Mock).mockResolvedValue({
        records: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
      });
      (attendanceSchemas.selfHistoryQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await selfAttendanceHistoryController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.getSelfAttendanceHistory).toHaveBeenCalledWith(
        mockReq.userId,
        { page: 1, limit: 10 }
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockRecords,
        pagination: { total: 1, page: 1, limit: 10 },
        summary: { total: 1, present: 1, absent: 0, notyet: 0 },
        message: "Self attendance history fetched",
      });
    });
  });

  describe("exportAttendanceController", () => {
    it("should call exportAttendanceReport service with correct parameters", async () => {
      const mockExport = {
        format: "json",
        summary: { total: 1 },
        data: [{ _id: "1" }],
      };
      (attendanceService.exportAttendanceReport as jest.Mock).mockResolvedValue(mockExport);
      (attendanceSchemas.exportAttendanceQuerySchema.parse as jest.Mock).mockReturnValue({
        format: "json",
        courseId: "course123",
      });

      await exportAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.exportAttendanceReport).toHaveBeenCalledWith(
        { format: "json", courseId: "course123" },
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockExport,
        message: "Attendance export ready",
      });
    });
  });

  describe("courseStatsController", () => {
    it("should call getCourseAttendanceStats service with correct parameters", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const mockStats = {
        courseId,
        totalStudents: 10,
        classAttendanceRate: 85.5,
      };
      (attendanceService.getCourseAttendanceStats as jest.Mock).mockResolvedValue(mockStats);
      (attendanceSchemas.CourseIdParamSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (attendanceSchemas.courseStatsQuerySchema.parse as jest.Mock).mockReturnValue({});

      await courseStatsController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.getCourseAttendanceStats).toHaveBeenCalledWith(
        courseId,
        {},
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockStats,
        message: "Course attendance stats generated",
      });
    });
  });

  describe("studentStatsController", () => {
    it("should call getStudentAttendanceStats service with correct parameters", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const studentId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId, studentId };
      const mockStats = {
        courseId,
        studentId,
        attendanceRate: 90.5,
      };
      (attendanceService.getStudentAttendanceStats as jest.Mock).mockResolvedValue(mockStats);
      (attendanceSchemas.CourseIdParamSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (attendanceSchemas.StudentIdParamSchema.parse as jest.Mock).mockReturnValue({ studentId });
      (attendanceSchemas.courseStatsQuerySchema.parse as jest.Mock).mockReturnValue({});

      await studentStatsController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.getStudentAttendanceStats).toHaveBeenCalledWith(
        courseId,
        studentId,
        {},
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockStats,
        message: "Student attendance stats generated",
      });
    });
  });

  describe("markAttendanceController", () => {
    it("should call markAttendance service with correct parameters", async () => {
      const payload = {
        courseId: new mongoose.Types.ObjectId().toString(),
        date: new Date("2024-06-15"),
        entries: [
          { studentId: new mongoose.Types.ObjectId().toString(), status: AttendanceStatus.PRESENT },
        ],
      };
      const mockResult = {
        message: "Attendance marked successfully",
        records: [{ _id: "1" }],
        summary: { total: 1, present: 1 },
      };
      (attendanceService.markAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.markAttendanceSchema.parse as jest.Mock).mockReturnValue(payload);

      await markAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.markAttendance).toHaveBeenCalledWith(
        payload,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        data: mockResult,
        message: "Attendance recorded",
      });
    });
  });

  describe("sendAbsenceNotificationController", () => {
    it("should call sendAbsenceNotificationEmails service with correct parameters", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const payload = {
        studentIds: [new mongoose.Types.ObjectId().toString()],
      };
      const mockResult = {
        total: 1,
        success: 1,
        failed: 0,
        results: [{ studentId: "1", success: true }],
      };
      (attendanceService.sendAbsenceNotificationEmails as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.CourseIdParamSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (attendanceSchemas.sendAbsenceNotificationSchema.parse as jest.Mock).mockReturnValue(payload);

      await sendAbsenceNotificationController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.sendAbsenceNotificationEmails).toHaveBeenCalledWith(
        courseId,
        payload.studentIds,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: `Sent ${mockResult.success} email successfully, ${mockResult.failed} failed`,
      });
    });

    it.skip("should format message for multiple students", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const payload = {
        studentIds: [
          new mongoose.Types.ObjectId().toString(),
          new mongoose.Types.ObjectId().toString(),
        ],
      };
      const mockResult = {
        total: 2,
        success: 2,
        failed: 0,
        results: [],
      };
      (attendanceService.sendAbsenceNotificationEmails as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.CourseIdParamSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (attendanceSchemas.sendAbsenceNotificationSchema.parse as jest.Mock).mockReturnValue(payload);

      await sendAbsenceNotificationController(mockReq as Request, mockRes, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: `Sent ${mockResult.success} email(s) to ${payload.studentIds.length} student(s), ${mockResult.failed} failed`,
      });
    });
  });

  describe("updateAttendanceController", () => {
    it("should update single attendance record from params", async () => {
      const attendanceId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { attendanceId };
      const payload = { status: AttendanceStatus.ABSENT };
      const mockResult = { _id: attendanceId, status: AttendanceStatus.ABSENT };
      (attendanceService.updateAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.updateAttendanceSchema.parse as jest.Mock).mockReturnValue(payload);
      (attendanceSchemas.AttendanceIdParamSchema.parse as jest.Mock).mockReturnValue({ attendanceId });

      await updateAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.updateAttendance).toHaveBeenCalledWith(
        attendanceId,
        payload,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: "Attendance updated",
      });
    });

    it("should update multiple attendance records from body", async () => {
      const attendanceIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      const payload = {
        attendanceIds,
        status: AttendanceStatus.PRESENT,
      };
      const mockResult = { updated: 2, total: 2 };
      (attendanceService.updateAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.updateAttendanceSchema.parse as jest.Mock).mockReturnValue(payload);

      await updateAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.updateAttendance).toHaveBeenCalledWith(
        attendanceIds,
        payload,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: `Updated ${mockResult.updated} attendance record(s)`,
      });
    });
  });

  describe("deleteAttendanceController", () => {
    it("should delete single attendance record from params", async () => {
      const attendanceId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { attendanceId };
      const mockResult = { deleted: true, record: { _id: attendanceId } };
      (attendanceService.deleteAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.AttendanceIdParamSchema.parse as jest.Mock).mockReturnValue({ attendanceId });

      await deleteAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.deleteAttendance).toHaveBeenCalledWith(
        attendanceId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: "Attendance deleted",
      });
    });

    it("should delete multiple attendance records from body", async () => {
      const attendanceIds = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      mockReq.body = { attendanceIds };
      const mockResult = { deleted: 2, total: 2, skipped: 0 };
      (attendanceService.deleteAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.deleteAttendanceSchema.parse as jest.Mock).mockReturnValue({
        attendanceIds,
      });

      await deleteAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(attendanceService.deleteAttendance).toHaveBeenCalledWith(
        attendanceIds,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: `Deleted ${mockResult.deleted} attendance record(s)`,
      });
    });

    it.skip("should handle not found case", async () => {
      const attendanceId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { attendanceId };
      const mockResult = { deleted: false, record: null };
      (attendanceService.deleteAttendance as jest.Mock).mockResolvedValue(mockResult);
      (attendanceSchemas.AttendanceIdParamSchema.parse as jest.Mock).mockReturnValue({ attendanceId });

      await deleteAttendanceController(mockReq as Request, mockRes, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult,
        message: "Attendance not found or already deleted",
      });
    });
  });
});


