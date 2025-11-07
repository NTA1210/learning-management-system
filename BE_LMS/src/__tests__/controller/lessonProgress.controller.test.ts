// LessonProgress Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";

jest.mock("@/services/lessonProgress.service", () => ({
  getLessonProgress: jest.fn(),
  addTimeForLesson: jest.fn(),
  completeLesson: jest.fn(),
  getCourseProgress: jest.fn(),
}));

jest.mock("@/validators/lessonProgress.schemas", () => ({
  GetLessonProgressSchema: { parse: jest.fn() },
  AddTimeForLessonBodySchema: { parse: jest.fn() },
  LessonIdParamSchema: { parse: jest.fn() },
  GetCourseProgressSchema: { parse: jest.fn() },
}));

import * as service from "@/services/lessonProgress.service";
import * as schemas from "@/validators/lessonProgress.schemas";
import {
  getLessonProgressController,
  addTimeForLessonController,
  completeLessonController,
  getCourseProgressController,
} from "@/controller/lessonProgress.controller";

describe("⏳ LessonProgress Controller Unit Tests", () => {
  let req: Partial<Request> & any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { userId: new mongoose.Types.ObjectId(), role: "ADMIN", params: {}, query: {}, body: {} } as any;
    res = { success: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getLessonProgressController", () => {
    it("works without studentId", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.query = {};
      (schemas.GetLessonProgressSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      (service.getLessonProgress as jest.Mock).mockResolvedValue({ lessonId, progressPercent: 10 });
      await getLessonProgressController(req as Request, res as Response, next);
      expect(service.getLessonProgress).toHaveBeenCalledWith(lessonId, req.userId.toString(), req.role, undefined);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { lessonId, progressPercent: 10 },
        message: "Get lesson progress successfully"
      });
    });

    it("works with studentId query param", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      const studentId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.query = { studentId };
      (schemas.GetLessonProgressSchema.parse as jest.Mock).mockReturnValue({ lessonId, studentId });
      (service.getLessonProgress as jest.Mock).mockResolvedValue({ lessonId, progressPercent: 10 });
      await getLessonProgressController(req as Request, res as Response, next);
      expect(service.getLessonProgress).toHaveBeenCalledWith(lessonId, req.userId.toString(), req.role, studentId);
    });

    it("handles validation errors", async () => {
      req.params = { lessonId: "invalid" };
      const validationError = new Error("Invalid lesson ID format");
      (schemas.GetLessonProgressSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await getLessonProgressController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      (schemas.GetLessonProgressSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      const serviceError = new Error("Service error");
      (service.getLessonProgress as jest.Mock).mockRejectedValue(serviceError);
      await getLessonProgressController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("addTimeForLessonController", () => {
    it("works with valid data", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.body = { incSeconds: 30 };
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      (schemas.AddTimeForLessonBodySchema.parse as jest.Mock).mockReturnValue({ incSeconds: 30 });
      (service.addTimeForLesson as jest.Mock).mockResolvedValue({ timeSpentSeconds: 30, progressPercent: 50 });
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(service.addTimeForLesson).toHaveBeenCalledWith(lessonId, 30, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { timeSpentSeconds: 30, progressPercent: 50 },
        message: "Add time for lesson successfully"
      });
    });

    it("returns 400 when body is missing", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.body = null;
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Request body is required with incSeconds field",
        data: null
      });
    });

    it("returns 400 when incSeconds is missing", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.body = {};
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Request body is required with incSeconds field",
        data: null
      });
    });

    it("handles validation errors for params", async () => {
      req.params = { lessonId: "invalid" };
      const validationError = new Error("Invalid lesson ID format");
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles validation errors for body", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.body = { incSeconds: "invalid" };
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      const validationError = new Error("Validation failed");
      (schemas.AddTimeForLessonBodySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      req.body = { incSeconds: 30 };
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      (schemas.AddTimeForLessonBodySchema.parse as jest.Mock).mockReturnValue({ incSeconds: 30 });
      const serviceError = new Error("Service error");
      (service.addTimeForLesson as jest.Mock).mockRejectedValue(serviceError);
      await addTimeForLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("completeLessonController", () => {
    it("works with valid lessonId", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      (service.completeLesson as jest.Mock).mockResolvedValue({ isCompleted: true });
      await completeLessonController(req as Request, res as Response, next);
      expect(service.completeLesson).toHaveBeenCalledWith(lessonId, req.userId.toString(), req.role);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { isCompleted: true },
        message: "Complete lesson successfully"
      });
    });

    it("handles validation errors", async () => {
      req.params = { lessonId: "invalid" };
      const validationError = new Error("Invalid lesson ID format");
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await completeLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const lessonId = new mongoose.Types.ObjectId().toString();
      req.params = { lessonId };
      (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
      const serviceError = new Error("Service error");
      (service.completeLesson as jest.Mock).mockRejectedValue(serviceError);
      await completeLessonController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("getCourseProgressController", () => {
    it("works without studentId", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      req.params = { courseId };
      req.query = {};
      (schemas.GetCourseProgressSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (service.getCourseProgress as jest.Mock).mockResolvedValue({ completionRate: 50 });
      await getCourseProgressController(req as Request, res as Response, next);
      expect(service.getCourseProgress).toHaveBeenCalledWith(courseId, req.userId.toString(), req.role, undefined);
      expect(res.success).toHaveBeenCalledWith(200, {
        data: { completionRate: 50 },
        message: "Get course progress successfully"
      });
    });

    it("works with studentId query param", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const studentId = new mongoose.Types.ObjectId().toString();
      req.params = { courseId };
      req.query = { studentId };
      (schemas.GetCourseProgressSchema.parse as jest.Mock).mockReturnValue({ courseId, studentId });
      (service.getCourseProgress as jest.Mock).mockResolvedValue({ completionRate: 50 });
      await getCourseProgressController(req as Request, res as Response, next);
      expect(service.getCourseProgress).toHaveBeenCalledWith(courseId, req.userId.toString(), req.role, studentId);
    });

    it("handles validation errors", async () => {
      req.params = { courseId: "invalid" };
      const validationError = new Error("Invalid course ID format");
      (schemas.GetCourseProgressSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      await getCourseProgressController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(validationError);
    });

    it("handles service errors", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      req.params = { courseId };
      (schemas.GetCourseProgressSchema.parse as jest.Mock).mockReturnValue({ courseId });
      const serviceError = new Error("Service error");
      (service.getCourseProgress as jest.Mock).mockRejectedValue(serviceError);
      await getCourseProgressController(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith(serviceError);
    });
  });
});








