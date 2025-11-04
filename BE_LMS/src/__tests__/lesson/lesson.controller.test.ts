// Lesson Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock all services before importing controller
jest.mock("@/services/lesson.service", () => ({
  getLessons: jest.fn(),
  getLessonsByCourse: jest.fn(),
  getLessonById: jest.fn(),
  createLessonService: jest.fn(),
  updateLessonService: jest.fn(),
  deleteLessonService: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/lesson.schemas", () => ({
  CreateLessonSchema: {
    parse: jest.fn(),
  },
  LessonQuerySchema: {
    parse: jest.fn(),
  },
  LessonByCourseSchema: {
    parse: jest.fn(),
  },
  LessonByIdSchema: {
    parse: jest.fn(),
  },
}));

// Import controller and services
import {
  listAllLessons,
  getLessonsByCourseController,
  getLessonByIdController,
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/controller/lesson.controller";
import * as lessonService from "@/services/lesson.service";
import * as lessonSchemas from "@/validators/lesson.schemas";

describe("📚 Lesson Controller Unit Tests", () => {
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

  describe("listAllLessons", () => {
    it("should call getLessons service with correct parameters", async () => {
      const mockLessons = [{ _id: "1", title: "Lesson 1" }];
      (lessonService.getLessons as jest.Mock).mockResolvedValue({
        lessons: mockLessons,
        pagination: { page: 1, limit: 10, total: 1 }
      });
      (lessonSchemas.LessonQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        title: undefined,
      });

      await listAllLessons(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.getLessons).toHaveBeenCalledWith(
        { page: 1, limit: 10, title: undefined },
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockLessons,
        message: "Get all lessons successfully",
        pagination: { page: 1, limit: 10, total: 1 }
      });
    });

    it("should handle empty query parameters", async () => {
      (lessonService.getLessons as jest.Mock).mockResolvedValue({
        lessons: [],
        pagination: { page: 1, limit: 10, total: 0 }
      });
      (lessonSchemas.LessonQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listAllLessons(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.getLessons).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        mockReq.userId?.toString(),
        mockReq.role
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (lessonService.getLessons as jest.Mock).mockRejectedValue(error);
      (lessonSchemas.LessonQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listAllLessons(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getLessonsByCourseController", () => {
    it("should call getLessonsByCourse service with correct parameters", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const mockLessons = [{ _id: "1", title: "Lesson 1" }];
      (lessonService.getLessonsByCourse as jest.Mock).mockResolvedValue(mockLessons);
      (lessonSchemas.LessonByCourseSchema.parse as jest.Mock).mockReturnValue({ courseId });

      await getLessonsByCourseController(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.getLessonsByCourse).toHaveBeenCalledWith(
        courseId,
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockLessons,
        message: "Get lessons by course successfully",
      });
    });

    it("should handle invalid courseId parameter", async () => {
      mockReq.params = { courseId: "invalid" };
      const error = new Error("Invalid course ID format");
      (lessonSchemas.LessonByCourseSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getLessonsByCourseController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getLessonByIdController", () => {
    it("should call getLessonById service with correct parameters", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: lessonId };
      const mockLesson = { _id: lessonId, title: "Lesson 1" };
      (lessonService.getLessonById as jest.Mock).mockResolvedValue(mockLesson);
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });

      await getLessonByIdController(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.getLessonById).toHaveBeenCalledWith(
        lessonId,
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockLesson,
        message: "Get lesson by id successfully",
      });
    });

    it("should handle invalid lessonId parameter", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid lesson ID format");
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getLessonByIdController(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createLesson", () => {
    it("should call createLessonService with correct parameters", async () => {
      const lessonData = {
        title: "New Lesson",
        courseId: new mongoose.Types.ObjectId().toString(),
        content: "Lesson content",
        order: 1,
      };
      mockReq.body = lessonData;
      const mockCreatedLesson = { _id: "1", ...lessonData };
      (lessonSchemas.CreateLessonSchema.parse as jest.Mock).mockReturnValue(lessonData);
      (lessonService.createLessonService as jest.Mock).mockResolvedValue(mockCreatedLesson);

      await createLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.createLessonService).toHaveBeenCalledWith(
        lessonData,
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCreatedLesson,
        message: "Create lesson successfully",
      });
    });

    it("should handle validation errors", async () => {
      mockReq.body = { title: "" }; // Invalid data
      const validationError = new Error("Validation failed");
      (lessonSchemas.CreateLessonSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle service errors", async () => {
      const lessonData = { title: "New Lesson", courseId: "123" };
      mockReq.body = lessonData;
      const error = new Error("Service error");
      (lessonSchemas.CreateLessonSchema.parse as jest.Mock).mockReturnValue(lessonData);
      (lessonService.createLessonService as jest.Mock).mockRejectedValue(error);

      await createLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateLesson", () => {
    it("should call updateLessonService with correct parameters", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Lesson" };
      mockReq.params = { id: lessonId };
      mockReq.body = updateData;
      const mockUpdatedLesson = { _id: lessonId, ...updateData };
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });
      (lessonSchemas.CreateLessonSchema as any).partial = jest.fn().mockReturnValue({
        parse: jest.fn().mockReturnValue(updateData)
      });
      (lessonService.updateLessonService as jest.Mock).mockResolvedValue(mockUpdatedLesson);

      await updateLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.updateLessonService).toHaveBeenCalledWith(
        lessonId,
        updateData,
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockUpdatedLesson,
        message: "Update lesson successfully",
      });
    });

    it("should handle partial update data", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Title" };
      mockReq.params = { id: lessonId };
      mockReq.body = updateData;
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });
      (lessonSchemas.CreateLessonSchema as any).partial = jest.fn().mockReturnValue({
        parse: jest.fn().mockReturnValue(updateData)
      });
      (lessonService.updateLessonService as jest.Mock).mockResolvedValue({
        _id: lessonId,
        ...updateData,
      });

      await updateLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.updateLessonService).toHaveBeenCalledWith(
        lessonId,
        updateData,
        mockReq.userId?.toString(),
        mockReq.role
      );
    });

    it("should handle validation errors", async () => {
      mockReq.params = { id: "123" };
      mockReq.body = { title: "" };
      const validationError = new Error("Validation failed");
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await updateLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle authorization errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Lesson" };
      mockReq.params = { id: lessonId };
      mockReq.body = updateData;
      mockReq.role = Role.STUDENT; // Student cannot update
      const error = new Error("Not authorized");
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });
      (lessonSchemas.CreateLessonSchema as any).partial = jest.fn().mockReturnValue({
        parse: jest.fn().mockReturnValue(updateData)
      });
      (lessonService.updateLessonService as jest.Mock).mockRejectedValue(error);

      await updateLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteLesson", () => {
    it("should call deleteLessonService with correct parameters", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: lessonId };
      const mockDeletedLesson = { _id: lessonId, title: "Deleted Lesson" };
      (lessonService.deleteLessonService as jest.Mock).mockResolvedValue(mockDeletedLesson);
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });

      await deleteLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(lessonService.deleteLessonService).toHaveBeenCalledWith(
        lessonId,
        mockReq.userId?.toString(),
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockDeletedLesson,
        message: "Delete lesson successfully",
      });
    });

    it("should handle invalid lessonId parameter", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid lesson ID format");
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await deleteLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle authorization errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: lessonId };
      mockReq.role = Role.STUDENT; // Student cannot delete
      const error = new Error("Not authorized");
      (lessonSchemas.LessonByIdSchema.parse as jest.Mock).mockReturnValue({ id: lessonId });
      (lessonService.deleteLessonService as jest.Mock).mockRejectedValue(error);

      await deleteLesson(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing userId in request", async () => {
      mockReq.userId = undefined;
      (lessonSchemas.LessonQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listAllLessons(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle missing role in request", async () => {
      mockReq.role = undefined;
      (lessonSchemas.LessonQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listAllLessons(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    // Removed: controller wraps data into { data, message, ... }, service returning null is not a valid case here
  });
});