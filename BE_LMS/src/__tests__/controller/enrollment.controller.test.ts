
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

// Mock service layer
jest.mock("@/services/enrollment.service");

// Mock validators
jest.mock("@/validators/enrollment.schemas", () => ({
  enrollmentIdSchema: {
    parse: jest.fn(),
  },
  studentIdSchema: {
    parse: jest.fn(),
  },
  courseIdSchema: {
    parse: jest.fn(),
  },
  getEnrollmentsQuerySchema: {
    parse: jest.fn(),
  },
  createEnrollmentSchema: {
    parse: jest.fn(),
  },
  enrollSelfSchema: {
    parse: jest.fn(),
  },
  updateEnrollmentSchema: {
    parse: jest.fn(),
  },
  updateSelfEnrollmentSchema: {
    parse: jest.fn(),
  },
}));

describe("Enrollment Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
    } as any;

    // Setup mock response
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  // -------------------
  // getEnrollmentHandler
  // -------------------
  describe("getEnrollmentHandler", () => {
    it("Should get enrollment by id successfully", async () => {
      const mockEnrollmentId = "enroll123";
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "user123",
        courseId: "course123",
        status: "active",
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: mockEnrollmentId,
      });

      // Mock service
      (enrollmentService.getEnrollmentById as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.params = { id: mockEnrollmentId };

      // Call controller
      const handler = getEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.enrollmentIdSchema.parse).toHaveBeenCalledWith({
        id: mockEnrollmentId,
      });
      expect(enrollmentService.getEnrollmentById).toHaveBeenCalledWith(
        mockEnrollmentId
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, { data: mockEnrollment });
    });

    it("Should handle validation error", async () => {
      const validationError = new Error("Invalid ID format");

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockImplementation(
        () => {
          throw validationError;
        }
      );

      mockReq.params = { id: "invalid" };

      const handler = getEnrollmentHandler as any;

      // catchErrors handles the error, so it doesn't throw
      await handler(mockReq, mockRes, mockNext);

      // Verify the error was caught by catchErrors
      expect(enrollmentSchemas.enrollmentIdSchema.parse).toHaveBeenCalled();
    });
  });

  // -------------------
  // getMyEnrollmentsHandler
  // -------------------
  describe("getMyEnrollmentsHandler", () => {
    it("Should get authenticated user enrollments", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }, { _id: "enroll2" }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.query = { status: "active" };

      // Call controller
      const handler = getMyEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
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

  // -------------------
  // getStudentEnrollmentsHandler
  // -------------------
  describe("getStudentEnrollmentsHandler", () => {
    it("Should get specific student enrollments", async () => {
      const studentId = "student123";
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (enrollmentSchemas.studentIdSchema.parse as jest.Mock).mockReturnValue({
        studentId,
      });
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.params = { studentId };

      // Call controller
      const handler = getStudentEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.studentIdSchema.parse).toHaveBeenCalledWith({
        studentId,
      });
      expect(enrollmentService.getStudentEnrollments).toHaveBeenCalledWith({
        studentId: studentId,
        page: 1,
        limit: 10,
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  // -------------------
  // getCourseEnrollmentsHandler
  // -------------------
  describe("getCourseEnrollmentsHandler", () => {
    it("Should get course enrollments", async () => {
      const courseId = "course123";
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (enrollmentSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue({
        courseId,
      });
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
      });

      // Mock service
      (enrollmentService.getCourseEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.params = { courseId };
      mockReq.query = { status: "active" };

      // Call controller
      const handler = getCourseEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.getCourseEnrollments).toHaveBeenCalledWith({
        courseId,
        status: "active",
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  // -------------------
  // getAllEnrollmentsHandler
  // -------------------
  describe("getAllEnrollmentsHandler", () => {
    it("Should get all enrollments with filters", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }, { _id: "enroll2" }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getAllEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.query = { status: "active" };

      // Call controller
      const handler = getAllEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
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
  });

  // -------------------
  // createEnrollmentHandler
  // -------------------
  describe("createEnrollmentHandler", () => {
    it("Should create enrollment successfully", async () => {
      const enrollmentData = {
        studentId: "user123",
        courseId: "course123",
        status: "approved",
        role: "student",
      };
      const mockEnrollment = {
        _id: "enroll123",
        ...enrollmentData,
      };

      // Mock validator
      (
        enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(enrollmentData);

      // Mock service
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.body = enrollmentData;

      // Call controller
      const handler = createEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.createEnrollmentSchema.parse).toHaveBeenCalledWith(
        enrollmentData
      );
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        ...enrollmentData,
        status: "approved", // Admin creates enrollment with approved status by default
      });
      expect(mockRes.success).toHaveBeenCalledWith(
        CREATED,
        { data: mockEnrollment, message: "Enrollment created successfully" }
      );
    });

    it("Should handle service error", async () => {
      const enrollmentData = { studentId: "user123", courseId: "course123" };
      const serviceError = new Error("Course not found");

      (
        enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(enrollmentData);
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockReq.body = enrollmentData;

      const handler = createEnrollmentHandler as any;

      // catchErrors handles the error
      await handler(mockReq, mockRes, mockNext);

      // Verify service was called
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        ...enrollmentData,
        status: "approved", // Default status when admin creates
      });
    });
  });

  // -------------------
  // enrollSelfHandler
  // -------------------
  describe("enrollSelfHandler", () => {
    it("Should allow student to enroll themselves", async () => {
      const enrollData = {
        courseId: "course123",
        role: "student",
        password: "coursePassword123",
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "507f1f77bcf86cd799439011",
        courseId: "course123",
        role: "student",
        method: "self",
      };

      // Mock validator
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue(
        enrollData
      );

      // Mock service
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.body = enrollData;

      // Call controller
      const handler = enrollSelfHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        studentId: "507f1f77bcf86cd799439011",
        courseId: "course123",
        role: "student",
        method: "self",
        password: "coursePassword123",
      });
      expect(mockRes.success).toHaveBeenCalledWith(
        CREATED,
        { data: mockEnrollment, message: "Enrolled successfully" }
      );
    });
  });

  // -------------------
  // updateEnrollmentHandler
  // -------------------
  describe("updateEnrollmentHandler", () => {
    it("Should update enrollment successfully", async () => {
      const enrollmentId = "enroll123";
      const updateData = {
        status: "completed",
        finalGrade: 85,
      };
      const mockUpdatedEnrollment = {
        _id: enrollmentId,
        status: "completed",
        finalGrade: 85,
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(updateData);

      // Mock service
      (enrollmentService.updateEnrollment as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      // Call controller
      const handler = updateEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.updateEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        updateData
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        OK,
        { data: mockUpdatedEnrollment, message: "Enrollment updated successfully" }
      );
    });
  });

  // -------------------
  // updateSelfEnrollmentHandler
  // -------------------
  describe("updateSelfEnrollmentHandler", () => {
    it("Should allow student to cancel their enrollment", async () => {
      const enrollmentId = "enroll123";
      const updateData = {
        status: "cancelled",
      };
      const mockUpdatedEnrollment = {
        _id: enrollmentId,
        studentId: "507f1f77bcf86cd799439011",
        status: "cancelled",
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(updateData);

      // Mock service
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      // Call controller
      const handler = updateSelfEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.updateSelfEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        "507f1f77bcf86cd799439011",
        updateData
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        OK,
        { data: mockUpdatedEnrollment, message: "Enrollment updated successfully" }
      );
    });

    it("Should handle unauthorized access", async () => {
      const enrollmentId = "enroll123";
      const serviceError = new Error("Enrollment not found or access denied");

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue({ status: "cancelled" });
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.params = { id: enrollmentId };
      mockReq.body = { status: "cancelled" };

      const handler = updateSelfEnrollmentHandler as any;

      // catchErrors handles the error
      await handler(mockReq, mockRes, mockNext);

      // Verify service was called
      expect(enrollmentService.updateSelfEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        "507f1f77bcf86cd799439011",
        { status: "cancelled" }
      );
    });
  });
});
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

// Mock service layer
jest.mock("@/services/enrollment.service");

// Mock validators
jest.mock("@/validators/enrollment.schemas", () => ({
  enrollmentIdSchema: {
    parse: jest.fn(),
  },
  studentIdSchema: {
    parse: jest.fn(),
  },
  courseIdSchema: {
    parse: jest.fn(),
  },
  getEnrollmentsQuerySchema: {
    parse: jest.fn(),
  },
  createEnrollmentSchema: {
    parse: jest.fn(),
  },
  enrollSelfSchema: {
    parse: jest.fn(),
  },
  updateEnrollmentSchema: {
    parse: jest.fn(),
  },
  updateSelfEnrollmentSchema: {
    parse: jest.fn(),
  },
}));

describe("Enrollment Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
    } as any;

    // Setup mock response
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  // -------------------
  // getEnrollmentHandler
  // -------------------
  describe("getEnrollmentHandler", () => {
    it("Should get enrollment by id successfully", async () => {
      const mockEnrollmentId = "enroll123";
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "user123",
        courseId: "course123",
        status: "active",
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: mockEnrollmentId,
      });

      // Mock service
      (enrollmentService.getEnrollmentById as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.params = { id: mockEnrollmentId };

      // Call controller
      const handler = getEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.enrollmentIdSchema.parse).toHaveBeenCalledWith({
        id: mockEnrollmentId,
      });
      expect(enrollmentService.getEnrollmentById).toHaveBeenCalledWith(
        mockEnrollmentId
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, { data: mockEnrollment });
    });

    it("Should handle validation error", async () => {
      const validationError = new Error("Invalid ID format");

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockImplementation(
        () => {
          throw validationError;
        }
      );

      mockReq.params = { id: "invalid" };

      const handler = getEnrollmentHandler as any;

      // catchErrors handles the error, so it doesn't throw
      await handler(mockReq, mockRes, mockNext);

      // Verify the error was caught by catchErrors
      expect(enrollmentSchemas.enrollmentIdSchema.parse).toHaveBeenCalled();
    });
  });

  // -------------------
  // getMyEnrollmentsHandler
  // -------------------
  describe("getMyEnrollmentsHandler", () => {
    it("Should get authenticated user enrollments", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }, { _id: "enroll2" }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.query = { status: "active" };

      // Call controller
      const handler = getMyEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
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

  // -------------------
  // getStudentEnrollmentsHandler
  // -------------------
  describe("getStudentEnrollmentsHandler", () => {
    it("Should get specific student enrollments", async () => {
      const studentId = "student123";
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (enrollmentSchemas.studentIdSchema.parse as jest.Mock).mockReturnValue({
        studentId,
      });
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getStudentEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.params = { studentId };

      // Call controller
      const handler = getStudentEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.studentIdSchema.parse).toHaveBeenCalledWith({
        studentId,
      });
      expect(enrollmentService.getStudentEnrollments).toHaveBeenCalledWith({
        studentId: studentId,
        page: 1,
        limit: 10,
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  // -------------------
  // getCourseEnrollmentsHandler
  // -------------------
  describe("getCourseEnrollmentsHandler", () => {
    it("Should get course enrollments", async () => {
      const courseId = "course123";
      const mockResult = {
        enrollments: [{ _id: "enroll1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (enrollmentSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue({
        courseId,
      });
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
      });

      // Mock service
      (enrollmentService.getCourseEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.params = { courseId };
      mockReq.query = { status: "active" };

      // Call controller
      const handler = getCourseEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.getCourseEnrollments).toHaveBeenCalledWith({
        courseId,
        status: "active",
      });
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.enrollments,
        pagination: mockResult.pagination,
      });
    });
  });

  // -------------------
  // getAllEnrollmentsHandler
  // -------------------
  describe("getAllEnrollmentsHandler", () => {
    it("Should get all enrollments with filters", async () => {
      const mockResult = {
        enrollments: [{ _id: "enroll1" }, { _id: "enroll2" }],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      // Mock validator
      (
        enrollmentSchemas.getEnrollmentsQuerySchema.parse as jest.Mock
      ).mockReturnValue({
        status: "active",
        page: 1,
        limit: 10,
      });

      // Mock service
      (enrollmentService.getAllEnrollments as jest.Mock).mockResolvedValue(
        mockResult
      );

      mockReq.query = { status: "active" };

      // Call controller
      const handler = getAllEnrollmentsHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
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
  });

  // -------------------
  // createEnrollmentHandler
  // -------------------
  describe("createEnrollmentHandler", () => {
    it("Should create enrollment successfully", async () => {
      const enrollmentData = {
        studentId: "user123",
        courseId: "course123",
        status: "approved",
        role: "student",
      };
      const mockEnrollment = {
        _id: "enroll123",
        ...enrollmentData,
      };

      // Mock validator
      (
        enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(enrollmentData);

      // Mock service
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.body = enrollmentData;

      // Call controller
      const handler = createEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentSchemas.createEnrollmentSchema.parse).toHaveBeenCalledWith(
        enrollmentData
      );
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        ...enrollmentData,
        status: "approved", // Admin creates enrollment with approved status by default
      });
      expect(mockRes.success).toHaveBeenCalledWith(
        CREATED,
        { data: mockEnrollment, message: "Enrollment created successfully" }
      );
    });

    it("Should handle service error", async () => {
      const enrollmentData = { studentId: "user123", courseId: "course123" };
      const serviceError = new Error("Course not found");

      (
        enrollmentSchemas.createEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(enrollmentData);
      (enrollmentService.createEnrollment as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockReq.body = enrollmentData;

      const handler = createEnrollmentHandler as any;

      // catchErrors handles the error
      await handler(mockReq, mockRes, mockNext);

      // Verify service was called
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        ...enrollmentData,
        status: "approved", // Default status when admin creates
      });
    });
  });

  // -------------------
  // enrollSelfHandler
  // -------------------
  describe("enrollSelfHandler", () => {
    it("Should allow student to enroll themselves", async () => {
      const enrollData = {
        courseId: "course123",
        role: "student",
        password: "coursePassword123",
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "507f1f77bcf86cd799439011",
        courseId: "course123",
        role: "student",
        method: "self",
      };

      // Mock validator
      (enrollmentSchemas.enrollSelfSchema.parse as jest.Mock).mockReturnValue(
        enrollData
      );

      // Mock service
      (enrollmentService.createEnrollment as jest.Mock).mockResolvedValue(
        mockEnrollment
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.body = enrollData;

      // Call controller
      const handler = enrollSelfHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.createEnrollment).toHaveBeenCalledWith({
        studentId: "507f1f77bcf86cd799439011",
        courseId: "course123",
        role: "student",
        method: "self",
        password: "coursePassword123",
      });
      expect(mockRes.success).toHaveBeenCalledWith(
        CREATED,
        { data: mockEnrollment, message: "Enrolled successfully" }
      );
    });
  });

  // -------------------
  // updateEnrollmentHandler
  // -------------------
  describe("updateEnrollmentHandler", () => {
    it("Should update enrollment successfully", async () => {
      const enrollmentId = "enroll123";
      const updateData = {
        status: "completed",
        finalGrade: 85,
      };
      const mockUpdatedEnrollment = {
        _id: enrollmentId,
        status: "completed",
        finalGrade: 85,
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(updateData);

      // Mock service
      (enrollmentService.updateEnrollment as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      // Call controller
      const handler = updateEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.updateEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        updateData
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        OK,
        { data: mockUpdatedEnrollment, message: "Enrollment updated successfully" }
      );
    });
  });

  // -------------------
  // updateSelfEnrollmentHandler
  // -------------------
  describe("updateSelfEnrollmentHandler", () => {
    it("Should allow student to cancel their enrollment", async () => {
      const enrollmentId = "enroll123";
      const updateData = {
        status: "cancelled",
      };
      const mockUpdatedEnrollment = {
        _id: enrollmentId,
        studentId: "507f1f77bcf86cd799439011",
        status: "cancelled",
      };

      // Mock validator
      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue(updateData);

      // Mock service
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockResolvedValue(
        mockUpdatedEnrollment
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.params = { id: enrollmentId };
      mockReq.body = updateData;

      // Call controller
      const handler = updateSelfEnrollmentHandler as any;
      await handler(mockReq, mockRes, mockNext);

      // Assertions
      expect(enrollmentService.updateSelfEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        "507f1f77bcf86cd799439011",
        updateData
      );
      expect(mockRes.success).toHaveBeenCalledWith(
        OK,
        { data: mockUpdatedEnrollment, message: "Enrollment updated successfully" }
      );
    });

    it("Should handle unauthorized access", async () => {
      const enrollmentId = "enroll123";
      const serviceError = new Error("Enrollment not found or access denied");

      (enrollmentSchemas.enrollmentIdSchema.parse as jest.Mock).mockReturnValue({
        id: enrollmentId,
      });
      (
        enrollmentSchemas.updateSelfEnrollmentSchema.parse as jest.Mock
      ).mockReturnValue({ status: "cancelled" });
      (enrollmentService.updateSelfEnrollment as jest.Mock).mockRejectedValue(
        serviceError
      );

      mockReq.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011") as any;
      mockReq.params = { id: enrollmentId };
      mockReq.body = { status: "cancelled" };

      const handler = updateSelfEnrollmentHandler as any;

      // catchErrors handles the error
      await handler(mockReq, mockRes, mockNext);

      // Verify service was called
      expect(enrollmentService.updateSelfEnrollment).toHaveBeenCalledWith(
        enrollmentId,
        "507f1f77bcf86cd799439011",
        { status: "cancelled" }
      );
    });
  });
});