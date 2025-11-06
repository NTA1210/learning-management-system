// Unit tests for enrollment.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { OK, CREATED } from "@/constants/http";
import {
  getEnrollmentHandler,
  getMyEnrollmentsHandler,
  getStudentEnrollmentsHandler,
  getCourseEnrollmentsHandler,
  getAllEnrollmentsHandler,
  createEnrollmentHandler,
  enrollSelfHandler,
  updateEnrollmentHandler,
  updateSelfEnrollmentHandler,
} from "@/controller/enrollment.controller";
import * as enrollmentService from "@/services/enrollment.service";
import * as enrollmentSchemas from "@/validators/enrollment.schemas";

jest.mock("@/services/enrollment.service");
jest.mock("@/validators/enrollment.schemas", () => ({
  enrollmentIdSchema: { parse: jest.fn() },
  studentIdSchema: { parse: jest.fn() },
  courseIdSchema: { parse: jest.fn() },
  getEnrollmentsQuerySchema: { parse: jest.fn() },
  createEnrollmentSchema: { parse: jest.fn() },
  enrollSelfSchema: { parse: jest.fn() },
  updateEnrollmentSchema: { parse: jest.fn() },
  updateSelfEnrollmentSchema: { parse: jest.fn() },
}));

describe("Enrollment Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  const mockUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: mockUserId,
    } as any;
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("getEnrollmentHandler", () => {
    it("Should get enrollment by id successfully", async () => {
      const mockEnrollment = { _id: "enroll123", userId: "user123", courseId: "course123" };

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentService.getEnrollmentById as jest.Mock).mockResolvedValue(mockEnrollment);

      mockReq.params = { id: "enroll123" };

      await (getEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.getEnrollmentById).toHaveBeenCalledWith("enroll123");
      expect(mockRes.success).toHaveBeenCalledWith(OK, { data: mockEnrollment });
    });
  });

  describe("getMyEnrollmentsHandler", () => {
    it("Should get authenticated user enrollments", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { status: "active" };

      await (getMyEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.getStudentEnrollments).toHaveBeenCalledWith({
        studentId: "507f1f77bcf86cd799439011",
        status: "active",
        page: 1,
        limit: 10,
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  describe("getStudentEnrollmentsHandler", () => {
    it("Should get specific student enrollments", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (enrollmentSchemas.studentIdSchema.parse as jest.Mock).mockReturnValue({ studentId: "student123" });
      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { studentId: "student123" };

      await (getStudentEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.getStudentEnrollments).toHaveBeenCalledWith({
        studentId: "student123",
        page: 1,
        limit: 10,
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  describe("getCourseEnrollmentsHandler", () => {
    it("Should get course enrollments", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (enrollmentSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue({ courseId: "course123" });
      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockReturnValue({ status: "active" });
      (enrollmentService.getCourseEnrollments as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { courseId: "course123" };
      mockReq.query = { status: "active" };

      await (getCourseEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.getCourseEnrollments).toHaveBeenCalledWith({
        courseId: "course123",
        status: "active",
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  describe("getAllEnrollmentsHandler", () => {
    it("Should get all enrollments with filters", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });
      (enrollmentService.getAllEnrollments as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { status: "active" };

      await (getAllEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.getAllEnrollments).toHaveBeenCalledWith({
        status: "active",
        page: 1,
        limit: 10,
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });

    it("Should handle validation error for invalid query params", async () => {
      const validationError = new Error("Invalid status");
      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.query = { status: "invalid_status" };

      await (getAllEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error", async () => {
      const serviceError = new Error("Database error");
      (enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
      (enrollmentService.getAllEnrollments as jest.Mock).mockRejectedValue(serviceError);

      mockReq.query = {};

      await (getAllEnrollmentsHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("createEnrollmentHandler", () => {
    it("Should create enrollment successfully", async () => {
      const enrollmentData = { userId: "user123", courseId: "course123", role: "student" };
      const mockEnrollment = { _id: "enroll123", ...enrollmentData };

      (enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock).mockReturnValue(enrollmentData);
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(mockEnrollment);

      mockReq.body = enrollmentData;

      await (createEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        ...enrollmentData,
        status: "approved",
      });
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: mockEnrollment,
        message: "Enrollment created successfully",
      });
    });

    it("Should handle validation error for invalid data", async () => {
      const validationError = new Error("Invalid studentId format");
      (enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { studentId: "invalid", courseId: "course123" };

      await (createEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when student or course not found", async () => {
      const serviceError = new Error("Student not found");
      (enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock).mockReturnValue({
        studentId: "student123",
        courseId: "course123",
      });
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { studentId: "student123", courseId: "course123" };

      await (createEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("enrollSelfHandler", () => {
    it("Should allow student to enroll themselves", async () => {
      const enrollData = { courseId: "course123", role: "student" };
      const mockEnrollment = { _id: "enroll123", userId: "user123", courseId: "course123" };

      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue(enrollData);
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(mockEnrollment);

      mockReq.body = enrollData;

      await (enrollSelfHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        studentId: "507f1f77bcf86cd799439011",
        courseId: "course123",
        role: "student",
        method: "self",
        password: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: mockEnrollment,
        message: "Enrolled successfully",
      });
    });

    it("Should handle validation error for invalid courseId", async () => {
      const validationError = new Error("Invalid courseId format");
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { courseId: "invalid_id" };

      await (enrollSelfHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when course not found", async () => {
      const serviceError = new Error("Course not found");
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue({ courseId: "course123" });
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { courseId: "course123" };

      await (enrollSelfHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when already enrolled", async () => {
      const serviceError = new Error("Already enrolled in this course");
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue({ courseId: "course123" });
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { courseId: "course123" };

      await (enrollSelfHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when course password is incorrect", async () => {
      const serviceError = new Error("Invalid course password");
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue({
        courseId: "course123",
        password: "wrongpass",
      });
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { courseId: "course123", password: "wrongpass" };

      await (enrollSelfHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("updateEnrollmentHandler", () => {
    it("Should update enrollment successfully", async () => {
      const updateData = { status: "completed", finalGrade: 85 };
      const mockUpdatedEnrollment = { _id: "enroll123", ...updateData };

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock).mockReturnValue(updateData);
      (enrollmentService.updateEnrollment as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      mockReq.params = { id: "enroll123" };
      mockReq.body = updateData;

      await (updateEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.updateEnrollment).toHaveBeenCalledWith("enroll123", updateData);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockUpdatedEnrollment,
        message: "Enrollment updated successfully",
      });
    });

    it("Should handle validation error for invalid enrollment ID", async () => {
      const validationError = new Error("Invalid ID format");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "invalid_id" };
      mockReq.body = { status: "completed" };

      await (updateEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle validation error for invalid update data", async () => {
      const validationError = new Error("Invalid finalGrade value");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "enroll123" };
      mockReq.body = { finalGrade: 150 };

      await (updateEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when enrollment not found", async () => {
      const serviceError = new Error("Enrollment not found");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock).mockReturnValue({ status: "completed" });
      (enrollmentService.updateEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "enroll123" };
      mockReq.body = { status: "completed" };

      await (updateEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when course is expired", async () => {
      const serviceError = new Error("Cannot update enrollment for an expired course");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock).mockReturnValue({ status: "completed" });
      (enrollmentService.updateEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "enroll123" };
      mockReq.body = { status: "completed" };

      await (updateEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("updateSelfEnrollmentHandler", () => {
    it("Should allow student to update their enrollment", async () => {
      const updateData = { status: "dropped" };
      const mockUpdatedEnrollment = { _id: "enroll123", userId: "user123", status: "dropped" };

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock).mockReturnValue(updateData);
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      mockReq.params = { id: "enroll123" };
      mockReq.body = updateData;

      await (updateSelfEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(enrollmentService.updateSelfEnrollment).toHaveBeenCalledWith(
        "enroll123",
        "507f1f77bcf86cd799439011",
        updateData
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockUpdatedEnrollment,
        message: "Enrollment updated successfully",
      });
    });

    it("Should handle validation error for invalid enrollment ID", async () => {
      const validationError = new Error("Invalid ID format");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "invalid_id" };
      mockReq.body = { status: "cancelled" };

      await (updateSelfEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when enrollment not found or access denied", async () => {
      const serviceError = new Error("Enrollment not found or access denied");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock).mockReturnValue({ status: "cancelled" });
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "enroll123" };
      mockReq.body = { status: "cancelled" };

      await (updateSelfEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when trying to cancel completed enrollment", async () => {
      const serviceError = new Error("Cannot cancel a completed course");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock).mockReturnValue({ status: "cancelled" });
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "enroll123" };
      mockReq.body = { status: "cancelled" };

      await (updateSelfEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when course is expired", async () => {
      const serviceError = new Error("Cannot cancel enrollment for an expired course");
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({ id: "enroll123" });
      (enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock).mockReturnValue({ status: "cancelled" });
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "enroll123" };
      mockReq.body = { status: "cancelled" };

      await (updateSelfEnrollmentHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
