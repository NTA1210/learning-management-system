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
    admin: new mongoose.Types.ObjectId(),
    teacher: new mongoose.Types.ObjectId(),
    student: new mongoose.Types.ObjectId(),
    course: new mongoose.Types.ObjectId(),
    lesson: new mongoose.Types.ObjectId(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (appAssert as unknown as jest.Mock).mockImplementation((cond: any, _code: any, message: string) => { if (!cond) throw new Error(message); });
  });

  describe("getLessonProgress", () => {
    it("admin can get any progress", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [], isPublished: true }, durationMinutes: 10 }) }) });
      (LessonProgressModel.findOne as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ lessonId: ids.lesson, studentId: ids.student, timeSpentSeconds: 60 }) });
      const res = await getLessonProgress(ids.lesson.toString(), ids.admin, Role.ADMIN, ids.student.toString());
      expect(res.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it("student can get own progress", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [ids.teacher], isPublished: true }, durationMinutes: 10 }) }) });
      (LessonProgressModel.findOne as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ lessonId: ids.lesson, studentId: ids.student, timeSpentSeconds: 60 }) });
      const res = await getLessonProgress(ids.lesson.toString(), ids.student, Role.STUDENT);
      expect(res.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it("student cannot view other student's progress", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [], isPublished: true } }) }) });
      const otherStudentId = new mongoose.Types.ObjectId().toString();
      await expect(getLessonProgress(ids.lesson.toString(), ids.student, Role.STUDENT, otherStudentId)).rejects.toThrow("Cannot view other student's progress");
    });

    it("teacher instructor can view student progress", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [ids.teacher], isPublished: true }, durationMinutes: 10 }) }) });
      (LessonProgressModel.findOne as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ lessonId: ids.lesson, studentId: ids.student, timeSpentSeconds: 60 }) });
      const res = await getLessonProgress(ids.lesson.toString(), ids.teacher, Role.TEACHER, ids.student.toString());
      expect(res.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it("teacher must be instructor", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [] } }) }) });
      await expect(getLessonProgress(ids.lesson.toString(), ids.teacher, Role.TEACHER, ids.student.toString())).rejects.toThrow("Not authorized to view progress for this lesson");
    });

    it.skip("throws error for invalid lesson ID", async () => {
      await expect(getLessonProgress("invalid", ids.admin, Role.ADMIN)).rejects.toThrow("Invalid lesson ID");
    });

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
      await expect(getLessonProgress(ids.lesson.toString(), ids.admin, Role.ADMIN)).rejects.toThrow("Lesson not found");
    });

    it.skip("throws error when progress record missing", async () => {
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { teacherIds: [], isPublished: true }, durationMinutes: 10 })
        })
      });
      (LessonProgressModel.findOne as any).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(getLessonProgress(ids.lesson.toString(), ids.admin, Role.ADMIN)).rejects.toThrow("Progress not found");
    });
  });

  describe("addTimeForLesson", () => {
    it("student increments time and may complete at 100%", async () => {
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

    it("student increments time without completing", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course }, durationMinutes: 10 }) }) });
      (EnrollmentModel.exists as any).mockResolvedValue(true);
      const progressDoc = {
        toObject: () => ({ lessonId: ids.lesson, courseId: ids.course, studentId: ids.student, timeSpentSeconds: 60, isCompleted: false }),
        save: jest.fn(),
        isCompleted: false,
        timeSpentSeconds: 60,
      } as any;
      (LessonProgressModel.findOneAndUpdate as any).mockResolvedValue(progressDoc);
      const res = await addTimeForLesson(ids.lesson.toString(), 60, ids.student, Role.STUDENT);
      expect(res.progressPercent).toBeLessThan(100);
    });

    it("rejects teacher updating time", async () => {
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue({
              _id: ids.lesson,
              courseId: { _id: ids.course },
            }),
        }),
      });
      await expect(
        addTimeForLesson(ids.lesson.toString(), 10, ids.teacher, Role.TEACHER)
      ).rejects.toThrow("Teacher cannot update student progress");
    });

    it("rejects when incSeconds exceeds real elapsed time multiplier", async () => {
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: ids.lesson,
            courseId: { _id: ids.course },
            durationMinutes: 5,
          }),
        }),
      });
      (EnrollmentModel.exists as any).mockResolvedValue(true);

      // 20 seconds since last access -> HEARTBEAT_MIN_INTERVAL satisfied,
      // but MAX_TIME_MULTIPLIER (1.3) makes maxAllowed = floor(20 * 1.3) = 26
      const lastAccessedAt = new Date(Date.now() - 20 * 1000);
      (LessonProgressModel.findOne as any).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          lessonId: ids.lesson,
          courseId: ids.course,
          studentId: ids.student,
          timeSpentSeconds: 30,
          lastAccessedAt,
        }),
      });

      await expect(
        addTimeForLesson(ids.lesson.toString(), 40, ids.student, Role.STUDENT)
      ).rejects.toThrow("Time increment exceeds real elapsed time"); 
    });

    it("admin can update time", async () => {
      (LessonModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: ids.lesson,
            courseId: { _id: ids.course },
            durationMinutes: 10,
          }),
        }),
      });
      // No existing progress -> skip heartbeat / anti-cheat branch
      (LessonProgressModel.findOne as any).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      const progressDoc = {
        toObject: () => ({ lessonId: ids.lesson, courseId: ids.course, studentId: ids.admin, timeSpentSeconds: 60, isCompleted: false }),
        save: jest.fn(),
        isCompleted: false,
        timeSpentSeconds: 60,
      } as any;
      (LessonProgressModel.findOneAndUpdate as any).mockResolvedValue(progressDoc);
      const res = await addTimeForLesson(ids.lesson.toString(), 60, ids.admin, Role.ADMIN);
      expect(res).toBeDefined();
    });

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
      await expect(addTimeForLesson(ids.lesson.toString(), 10, ids.student, Role.STUDENT)).rejects.toThrow("Lesson not found");
    });

    it("throws error when student not enrolled", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course } }) }) });
      (EnrollmentModel.exists as any).mockResolvedValue(false);
      await expect(addTimeForLesson(ids.lesson.toString(), 10, ids.student, Role.STUDENT)).rejects.toThrow("Not enrolled");
    });

    it.skip("throws error for invalid lesson ID", async () => {
      await expect(addTimeForLesson("invalid", 10, ids.student, Role.STUDENT)).rejects.toThrow();
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

    it("throws error when lesson not found", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
      await expect(completeLesson(ids.lesson.toString(), ids.student, Role.STUDENT)).rejects.toThrow("Lesson not found");
    });

    it("throws error when student not enrolled", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course } }) }) });
      (EnrollmentModel.exists as any).mockResolvedValue(false);
      await expect(completeLesson(ids.lesson.toString(), ids.student, Role.STUDENT)).rejects.toThrow("Not enrolled");
    });

    it("throws error when teacher tries to complete", async () => {
      (LessonModel.findById as any).mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.lesson, courseId: { _id: ids.course } }) }) });
      await expect(completeLesson(ids.lesson.toString(), ids.teacher, Role.TEACHER)).rejects.toThrow("Teacher cannot complete for student");
    });

    it.skip("throws error for invalid lesson ID", async () => {
      await expect(completeLesson("invalid", ids.student, Role.STUDENT)).rejects.toThrow();
    });
  });

  describe("getCourseProgress", () => {
    it("admin can view any student progress", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [ids.teacher] }) });
      (LessonModel.find as any).mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "A", order: 1, durationMinutes: 1 }]) }) });
      (LessonProgressModel.find as any).mockReturnValue({ lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: true, timeSpentSeconds: 60 }]) });
      const res = await getCourseProgress(ids.course.toString(), ids.admin, Role.ADMIN, ids.student.toString());
      expect(res).toHaveProperty("completionRate");
    });

    it("teacher instructor can view student progress", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [ids.teacher] }) });
      (LessonModel.find as any).mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "A", order: 1, durationMinutes: 1 }, { _id: new mongoose.Types.ObjectId(), title: "B", order: 2, durationMinutes: 2 }]) }) });
      (LessonProgressModel.find as any).mockReturnValue({ lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: true, timeSpentSeconds: 60 }]) });
      const res = await getCourseProgress(ids.course.toString(), ids.teacher, Role.TEACHER, ids.student.toString());
      expect(res).toHaveProperty("completionRate");
    });

    it("teacher non-instructor cannot view student progress", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [] }) });
      await expect(getCourseProgress(ids.course.toString(), ids.teacher, Role.TEACHER, ids.student.toString())).rejects.toThrow("Not authorized");
    });

    it("student can view own progress", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [] }) });
      (LessonModel.find as any).mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "A", order: 1, durationMinutes: 1 }]) }) });
      (LessonProgressModel.find as any).mockReturnValue({ lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: true, timeSpentSeconds: 60 }]) });
      const res = await getCourseProgress(ids.course.toString(), ids.student, Role.STUDENT);
      expect(res).toHaveProperty("completionRate");
    });

    it("applies from/to filters to lessons and progress queries", async () => {
      const fromDate = new Date("2024-04-01");
      const toDate = new Date("2024-04-30");
      const lessonFindMock = {
        sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "Filtered", order: 1, durationMinutes: 1 }]) })
      };
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [ids.teacher] }) });
      (LessonModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
        return lessonFindMock;
      });
      (LessonProgressModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
        return { lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: false, timeSpentSeconds: 0 }]) };
      });

      const result = await getCourseProgress(ids.course.toString(), ids.admin, Role.ADMIN, ids.student.toString(), { from: fromDate, to: toDate });
      expect(result.lessons).toHaveLength(1);
    });

    it.skip("applies only from filter to lessons and progress queries", async () => {
      const fromDate = new Date("2024-04-01");
      const lessonFindMock = {
        sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "Filtered", order: 1, durationMinutes: 1 }]) })
      };
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [ids.teacher] }) });
      (LessonModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toBeUndefined();
        return lessonFindMock;
      });
      (LessonProgressModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toBeUndefined();
        return { lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: false, timeSpentSeconds: 0 }]) };
      });

      const result = await getCourseProgress(ids.course.toString(), ids.admin, Role.ADMIN, ids.student.toString(), { from: fromDate });
      expect(result.lessons).toHaveLength(1);
    });

    it.skip("applies only to filter to lessons and progress queries", async () => {
      const toDate = new Date("2024-04-30");
      const lessonFindMock = {
        sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(), title: "Filtered", order: 1, durationMinutes: 1 }]) })
      };
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ids.course, teacherIds: [ids.teacher] }) });
      (LessonModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeUndefined();
        expect(filter.createdAt.$lte).toEqual(toDate);
        return lessonFindMock;
      });
      (LessonProgressModel.find as any).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeUndefined();
        expect(filter.createdAt.$lte).toEqual(toDate);
        return { lean: jest.fn().mockResolvedValue([{ lessonId: new mongoose.Types.ObjectId(), isCompleted: false, timeSpentSeconds: 0 }]) };
      });

      const result = await getCourseProgress(ids.course.toString(), ids.admin, Role.ADMIN, ids.student.toString(), { to: toDate });
      expect(result.lessons).toHaveLength(1);
    });

    it("throws error when course not found", async () => {
      (CourseModel.findById as any).mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(getCourseProgress(ids.course.toString(), ids.admin, Role.ADMIN, ids.student.toString())).rejects.toThrow("Course not found");
    });

    it.skip("throws error for invalid course ID", async () => {
      await expect(getCourseProgress("invalid", ids.admin, Role.ADMIN, ids.student.toString())).rejects.toThrow();
    });
  });
});


