// LessonProgress Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

jest.mock("@/models/lesson.model");
jest.mock("@/models/course.model");
jest.mock("@/models/lessonProgress.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/utils/appAssert");

import LessonModel from "@/models/lesson.model";
import CourseModel from "@/models/course.model";
import LessonProgressModel from "@/models/lessonProgress.model";
import EnrollmentModel from "@/models/enrollment.model";
import appAssert from "@/utils/appAssert";

import { addTimeForLesson, completeLesson, getCourseProgress, getLessonProgress } from "@/services/lessonProgress.service";

describe("⏳ LessonProgress Service Unit Tests", () => {
  const ids = {
    admin: new mongoose.Types.ObjectId().toString(),
    teacher: new mongoose.Types.ObjectId().toString(),
    student: new mongoose.Types.ObjectId().toString(),
    course: new mongoose.Types.ObjectId(),
    lesson: new mongoose.Types.ObjectId(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (appAssert as unknown as jest.Mock).mockImplementation((cond: any, _code: any, message: string) => { if (!cond) throw new Error(message); });
  });

  describe("getLessonProgress", () => {
    it("student can get own progress", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [new mongoose.Types.ObjectId(ids.teacher)], isPublished: true }, durationMinutes: 10 }) }) });
      (LessonProgressModel.findOne as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ lessonId: ids.lesson, studentId: ids.student, timeSpentSeconds: 60 }) });
      const res = await getLessonProgress(ids.lesson.toString(), ids.student, Role.STUDENT);
      expect(res.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it("teacher must be instructor", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [] } }) }) });
      await expect(getLessonProgress(ids.lesson.toString(), ids.teacher, Role.TEACHER, ids.student)).rejects.toThrow("Not authorized to view progress for this lesson");
    });
  });

  describe("addTimeForLesson", () => {
    it("increments time and may complete at 100%", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course }, durationMinutes: 1 }) }) });
      (EnrollmentModel.exists as any).mockResolvedValue(true);
      const progressDoc = {
        toObject: () => ({ lessonId: ids.lesson, courseId: ids.course, studentId: ids.student, timeSpentSeconds: 120, isCompleted: false }),
        save: jest.fn(),
        isCompleted: false,
        timeSpentSeconds: 120,
      } as any;
      (LessonProgressModel.findOneAndUpdate as any).mockResolvedValue(progressDoc);
      const res = await addTimeForLesson(ids.lesson.toString(), 120, ids.student, Role.STUDENT);
      expect(res.progressPercent).toBe(100);
    });

    it("rejects teacher updating time", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course } }) }) });
      await expect(addTimeForLesson(ids.lesson.toString(), 10, ids.teacher, Role.TEACHER)).rejects.toThrow("Teacher cannot update student's time");
    });
  });

  describe("completeLesson", () => {
    it("student completes progress idempotently", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course } }) }) });
      (EnrollmentModel.exists as any).mockResolvedValue(true);
      (LessonProgressModel.findOneAndUpdate as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ isCompleted: true, timeSpentSeconds: 30 }) });
      const res = await completeLesson(ids.lesson.toString(), ids.student, Role.STUDENT);
      expect(res.isCompleted).toBe(true);
    });
  });

  describe("getCourseProgress", () => {
    it("computes completion rate", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [new mongoose.Types.ObjectId(ids.teacher)] }) });
      (LessonModel.find as any).mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "A", order: 1, durationMinutes: 1 }, { _id: new mongoose.Types.ObjectId(), title: "B", order: 2, durationMinutes: 2 }]) }) });
      (LessonProgressModel.find as any).mockReturnValue({ lean: jest.fn().mockResolvedValue([{ lessonId: { toString: () => "x" }, isCompleted: true, timeSpentSeconds: 60 }]) });
      const res = await getCourseProgress(ids.course.toString(), ids.teacher, Role.TEACHER, ids.student);
      expect(res).toHaveProperty("completionRate");
    });
  });
});


