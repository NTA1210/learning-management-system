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

  it("getLessonProgressController works", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.params = { lessonId };
    (schemas.GetLessonProgressSchema.parse as jest.Mock).mockReturnValue({ lessonId });
    (service.getLessonProgress as jest.Mock).mockResolvedValue({ lessonId, progressPercent: 10 });
    await getLessonProgressController(req as Request, res as Response, next);
    expect(res.success).toHaveBeenCalled();
  });

  it("addTimeForLessonController works", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.params = { lessonId };
    req.body = { incSeconds: 30 };
    (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
    (schemas.AddTimeForLessonBodySchema.parse as jest.Mock).mockReturnValue({ incSeconds: 30 });
    (service.addTimeForLesson as jest.Mock).mockResolvedValue({ timeSpentSeconds: 30 });
    await addTimeForLessonController(req as Request, res as Response, next);
    expect(service.addTimeForLesson).toHaveBeenCalled();
  });

  it("completeLessonController works", async () => {
    const lessonId = new mongoose.Types.ObjectId().toString();
    req.params = { lessonId };
    (schemas.LessonIdParamSchema.parse as jest.Mock).mockReturnValue({ lessonId });
    (service.completeLesson as jest.Mock).mockResolvedValue({ isCompleted: true });
    await completeLessonController(req as Request, res as Response, next);
    expect(res.success).toHaveBeenCalled();
  });

  it("getCourseProgressController works", async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    req.params = { courseId };
    (schemas.GetCourseProgressSchema.parse as jest.Mock).mockReturnValue({ courseId });
    (service.getCourseProgress as jest.Mock).mockResolvedValue({ completionRate: 50 });
    await getCourseProgressController(req as Request, res as Response, next);
    expect(service.getCourseProgress).toHaveBeenCalled();
  });
});








