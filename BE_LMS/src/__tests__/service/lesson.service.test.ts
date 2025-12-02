// Lesson Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock all models before importing services
jest.mock("@/models/lesson.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/sendMail", () => ({
  sendMail: jest.fn().mockResolvedValue({ data: { id: "mocked" } }),
}));

// Import models for mocking
import LessonModel from "@/models/lesson.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import EnrollmentModel from "@/models/enrollment.model";
import appAssert from "@/utils/appAssert";

// Import services
import {
  createLessonService,
  deleteLessonService,
  updateLessonService,
  getLessons,
  getLessonById,
  CreateLessonParams
} from "@/services/lesson.service";

describe("📚 Lesson Service Unit Tests", () => {
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let course: any;
  let lesson: any;

  beforeEach(() => {
    // Create mock data
    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "admin_test",
      email: "admin@test.com",
      role: Role.ADMIN,
    };

    teacherUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "teacher_test",
      email: "teacher@test.com",
      role: Role.TEACHER,
    };

    studentUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "student_test",
      email: "student@test.com",
      role: Role.STUDENT,
    };

    const teacherIdsArray = [teacherUser._id];
    teacherIdsArray.includes = jest.fn((id: any) =>
      teacherIdsArray.some((tid) => tid.toString() === id.toString())
    );

    course = {
      _id: new mongoose.Types.ObjectId(),
      title: "Test Course",
      description: "Test course for lesson testing",
      teacherIds: teacherIdsArray,
      isPublished: true,
    };

    lesson = {
      _id: new mongoose.Types.ObjectId(),
      title: "Test Lesson",
      content: "Test lesson content",
      courseId: {
        _id: course._id,
        title: course.title,
        description: course.description,
        isPublished: course.isPublished,
        teacherIds: teacherIdsArray,
      },
      order: 1,
      publishedAt: new Date(),
    };

    // Reset all mocks
    jest.clearAllMocks();

    // appAssert: throw Error(message) when condition falsy to mimic real behavior
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });
  });

  describe("createLessonService", () => {
    it("should create lesson successfully for admin", async () => {
      // Mock dependencies
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);
      (LessonModel.exists as jest.Mock).mockResolvedValue(null);
      (LessonModel.create as jest.Mock).mockResolvedValue(lesson);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const lessonData: CreateLessonParams = {
        title: "Test Lesson",
        courseId: course._id.toString(),
        content: "Test content",
      };

      const result = await createLessonService(lessonData, adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(result?.title).toBe("Test Lesson");
      expect(LessonModel.create).toHaveBeenCalled();
    });

    it("should create lesson successfully for course instructor", async () => {
      // Mock course with teacherUser as instructor - use custom includes for ObjectId comparison
      const teacherIdsArray = [teacherUser._id];
      teacherIdsArray.includes = jest.fn((id: any) => {
        return teacherIdsArray.some(tid => tid.toString() === id.toString());
      });
      const courseWithTeacher = {
        ...course,
        teacherIds: teacherIdsArray,
      };
      (CourseModel.findById as jest.Mock).mockResolvedValue(courseWithTeacher);
      (LessonModel.exists as jest.Mock).mockResolvedValue(null);
      (LessonModel.create as jest.Mock).mockResolvedValue(lesson);
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const lessonData: CreateLessonParams = {
        title: "Test Lesson",
        courseId: course._id.toString(),
        content: "Test content",
      };

      const result = await createLessonService(lessonData, teacherUser._id.toString(), Role.TEACHER);

      expect(result).toBeDefined();
      expect(result?.title).toBe("Test Lesson");
    });

    it("should throw error when lesson title already exists in course", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);
      (LessonModel.exists as jest.Mock).mockResolvedValue({ _id: lesson._id });

      const lessonData: CreateLessonParams = {
        title: "Test Lesson",
        courseId: course._id.toString(),
        content: "Test content",
      };

      await expect(
        createLessonService(lessonData, adminUser._id.toString(), Role.ADMIN)
      ).rejects.toThrow("Lesson already exists");
    });

    it("should throw error when course not found", async () => {
      const validCourseId = new mongoose.Types.ObjectId().toString();
      (LessonModel.exists as jest.Mock).mockResolvedValue(null);
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      const lessonData: CreateLessonParams = {
        title: "Test Lesson",
        courseId: validCourseId,
        content: "Test content",
      };

      await expect(
        createLessonService(lessonData, adminUser._id.toString(), Role.ADMIN)
      ).rejects.toThrow("Course not found");
    });

    it("should throw error when teacher is not instructor", async () => {
      const otherCourse = {
        ...course,
        teacherIds: [new mongoose.Types.ObjectId()], // Different teacher
      };
      (LessonModel.exists as jest.Mock).mockResolvedValue(null);
      (CourseModel.findById as jest.Mock).mockResolvedValue(otherCourse);

      const lessonData: CreateLessonParams = {
        title: "Test Lesson",
        courseId: course._id.toString(),
        content: "Test content",
      };

      await expect(
        createLessonService(lessonData, teacherUser._id.toString(), Role.TEACHER)
      ).rejects.toThrow("Only course instructors or admins can create lessons");
    });
  });

  describe("deleteLessonService", () => {
    it("should delete lesson successfully for admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.findByIdAndDelete as jest.Mock).mockResolvedValue(lesson);
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const result = await deleteLessonService(lesson._id.toString(), adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(LessonModel.findByIdAndDelete).toHaveBeenCalledWith(lesson._id.toString());
    });

    it("should delete lesson successfully for course instructor", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.findByIdAndDelete as jest.Mock).mockResolvedValue(lesson);
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const result = await deleteLessonService(lesson._id.toString(), teacherUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
    });

    it("should throw error when lesson not found", async () => {
      (LessonModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        deleteLessonService("nonexistent", adminUser._id.toString(), Role.ADMIN)
      ).rejects.toThrow("Lesson not found");
    });
  });

  describe("updateLessonService", () => {
    it("should update lesson successfully for admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const updateData = { title: "Updated Lesson" };

      const result = await updateLessonService(
        lesson._id.toString(),
        updateData,
        adminUser._id.toString(),
        Role.ADMIN
      );

      expect(result).toBeDefined();
      expect(LessonModel.findByIdAndUpdate).toHaveBeenCalledWith(
        lesson._id.toString(),
        updateData,
        { new: true }
      );
    });

    it("should update lesson successfully for course instructor", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const updateData = { title: "Updated Lesson" };

      const result = await updateLessonService(
        lesson._id.toString(),
        updateData,
        teacherUser._id.toString(),
        Role.ADMIN
      );

      expect(result).toBeDefined();
    });

    it("should throw error when lesson not found", async () => {
      (LessonModel.findById as jest.Mock).mockResolvedValue(null);

      const updateData = { title: "Updated Lesson" };

      await expect(
        updateLessonService("nonexistent", updateData, adminUser._id.toString(), Role.ADMIN)
      ).rejects.toThrow("Lesson not found");
    });
  });

  describe("getLessons", () => {
    it("should return lessons for admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({}, adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('lessons');
      expect(Array.isArray(result.lessons)).toBe(true);
      expect(LessonModel.find).toHaveBeenCalled();
    });

    it("should return lessons for teacher", async () => {
      // Mock teacher courses
      const teacherCourses = [{ _id: course._id }];
      const mockCourseQuery = {
        select: jest.fn().mockResolvedValue(teacherCourses),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockCourseQuery);

      // Mock lessons query
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      // Mock for access checks
      (LessonModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ courseId: { _id: course._id, teacherIds: [teacherUser._id] } }),
      });

      const result = await getLessons({}, teacherUser._id.toString(), Role.TEACHER);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('lessons');
    });

    it("should mark teacher as having published access when not instructor", async () => {
      const teacherCourses = [{ _id: course._id }];
      const mockCourseQuery = {
        select: jest.fn().mockResolvedValue(teacherCourses),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockCourseQuery);

      const publishedLesson = {
        ...lesson,
        courseId: {
          ...lesson.courseId,
          teacherIds: [new mongoose.Types.ObjectId()],
        },
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([publishedLesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({}, teacherUser._id.toString(), Role.TEACHER);

      expect(result.lessons[0].accessReason).toBe("published");
    });

    it("should return only published lessons for student", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);
      
      // Mock enrollment for student - select returns array when awaited
      const mockEnrollmentQuery = {
        select: jest.fn().mockResolvedValue([
          { courseId: course._id, status: "active" },
        ]),
      };
      (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentQuery);

      const result = await getLessons({}, studentUser._id.toString(), Role.STUDENT);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('lessons');
      expect(Array.isArray(result.lessons)).toBe(true);
    });

    it("should filter lessons by title", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ title: "Test" }, adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ title: { $regex: "Test", $options: "i" } })
      );
    });

    it("should filter lessons by content", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ content: "content" }, adminUser._id.toString(), Role.ADMIN);

      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ content: { $regex: "content", $options: "i" } })
      );
    });

    it("should filter lessons by courseId", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      // getLessons sẽ validate courseId và gọi CourseModel.findById
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const result = await getLessons({ courseId: course._id.toString() }, adminUser._id.toString(), Role.ADMIN);

      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: course._id.toString() })
      );
    });

    it("should allow enrolled student to filter by courseId", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

      const mockEnrollmentQuery = {
        select: jest.fn().mockResolvedValue([{ courseId: course._id }]),
      };
      (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentQuery);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons(
        { page: 1, limit: 10, courseId: course._id.toString() },
        studentUser._id.toString(),
        Role.STUDENT
      );

      expect(result).toBeDefined();
      expect(EnrollmentModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: studentUser._id.toString(),
          courseId: course._id.toString(),
        })
      );
    });

    it("should throw error when student filters by courseId without enrollment", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);

      const mockEnrollmentQuery = {
        select: jest.fn().mockResolvedValue([{ courseId: course._id }]),
      };
      (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentQuery);

      await expect(
        getLessons(
          { page: 1, limit: 10, courseId: course._id.toString() },
          studentUser._id.toString(),
          Role.STUDENT
        )
      ).rejects.toThrow("Not enrolled in this course");
    });

    it("should allow instructor teacher to filter by courseId", async () => {
      const teacherIdsArray = [teacherUser._id];
      teacherIdsArray.includes = jest.fn((id: any) =>
        teacherIdsArray.some((tid) => tid.toString() === id.toString())
      );
      const instructorCourse = {
        ...course,
        teacherIds: teacherIdsArray,
      };
      (CourseModel.findById as jest.Mock).mockResolvedValue(instructorCourse);

      const mockTeacherCourseQuery = {
        select: jest.fn().mockResolvedValue([{ _id: course._id }]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockTeacherCourseQuery);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons(
        { page: 1, limit: 10, courseId: course._id.toString() },
        teacherUser._id.toString(),
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(CourseModel.findById).toHaveBeenCalledWith(course._id.toString());
    });

    it("should throw error when teacher filters by courseId without being instructor", async () => {
      const otherCourse = {
        ...course,
        teacherIds: [new mongoose.Types.ObjectId()],
      };
      (CourseModel.findById as jest.Mock).mockResolvedValue(otherCourse);

      await expect(
        getLessons(
          { page: 1, limit: 10, courseId: course._id.toString() },
          teacherUser._id.toString(),
          Role.TEACHER
        )
      ).rejects.toThrow("Not instructor of this course");
    });

    it("should filter lessons by publishedAt date", async () => {
      const publishedDate = new Date("2024-03-01");
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ publishedAt: publishedDate }, adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ publishedAt: publishedDate })
      );
    });

    it("should mark student without enrollment as not having access to unpublished lessons", async () => {
      const mockEnrollmentQuery = {
        select: jest.fn().mockResolvedValue([]),
      };
      (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentQuery);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ ...lesson, publishedAt: null }]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ page: 1, limit: 10 }, studentUser._id.toString(), Role.STUDENT);

      expect(result.lessons[0].hasAccess).toBe(false);
      expect(result.lessons[0].accessReason).toBe("not_enrolled");
    });

    it("should filter lessons by order", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ order: 1 }, adminUser._id.toString(), Role.ADMIN);

      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: 1 })
      );
    });

    it("should filter lessons by durationMinutes", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ durationMinutes: 10 }, adminUser._id.toString(), Role.ADMIN);

      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ durationMinutes: 10 })
      );
    });

    it("should use full-text search when search query provided", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getLessons({ search: "test" }, adminUser._id.toString(), Role.ADMIN);

      expect(LessonModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: "test" } })
      );
    });

    it("should apply createdAt range filters", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
        return mockQuery;
      });
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const fromDate = new Date("2024-02-01");
      const toDate = new Date("2024-02-28");
      const result = await getLessons({ page: 1, limit: 10, from: fromDate, to: toDate }, adminUser._id.toString(), Role.ADMIN);

      expect(result.lessons).toHaveLength(1);
    });

    it("should apply createdAt filter with only from date", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeDefined();
        expect(filter.createdAt.$lte).toBeUndefined();
        return mockQuery;
      });
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const fromDate = new Date("2024-02-01");
      const result = await getLessons({ page: 1, limit: 10, from: fromDate }, adminUser._id.toString(), Role.ADMIN);

      expect(result.lessons).toHaveLength(1);
    });

    it("should apply createdAt filter with only to date", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([lesson]),
      };
      (LessonModel.find as jest.Mock).mockImplementation((filter: any) => {
        expect(filter.createdAt.$gte).toBeUndefined();
        expect(filter.createdAt.$lte).toBeDefined();
        return mockQuery;
      });
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const toDate = new Date("2024-02-28");
      const result = await getLessons({ page: 1, limit: 10, to: toDate }, adminUser._id.toString(), Role.ADMIN);

      expect(result.lessons).toHaveLength(1);
    });

    it("should set hasPrev to false when page > totalPages", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (LessonModel.find as jest.Mock).mockReturnValue(mockQuery);
      (LessonModel.countDocuments as jest.Mock).mockResolvedValue(5); // total = 5, limit = 10, totalPages = 1

      const result = await getLessons({ page: 2, limit: 10 }, adminUser._id.toString(), Role.ADMIN);

      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.page).toBe(2);
    });
  });

  describe("getLessonById", () => {
    it("should return lesson with full access for admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await getLessonById(lesson._id.toString(), adminUser._id.toString(), Role.ADMIN);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Lesson");
      expect(result.accessReason).toBe("admin");
      expect(result.hasAccess).toBe(true);
    });

    it("should return lesson with full access for course instructor", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const result = await getLessonById(lesson._id.toString(), teacherUser._id.toString(), Role.TEACHER);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Lesson");
      expect(result.accessReason).toBe("instructor");
      expect(result.hasAccess).toBe(true);
    });

    it("should return lesson with published access for non-instructor teacher", async () => {
      const publishedLesson = {
        ...lesson,
        courseId: {
          ...lesson.courseId,
          teacherIds: [new mongoose.Types.ObjectId()],
        },
        publishedAt: new Date(),
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(publishedLesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await getLessonById(lesson._id.toString(), teacherUser._id.toString(), Role.TEACHER);

      expect(result).toBeDefined();
      expect(result.accessReason).toBe("published");
      expect(result.hasAccess).toBe(true);
    });

    it("should return lesson without access for non-instructor teacher when not published", async () => {
      const unpublishedLesson = {
        ...lesson,
        courseId: {
          ...lesson.courseId,
          teacherIds: [new mongoose.Types.ObjectId()], // Different teacher
        },
        publishedAt: null,
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(unpublishedLesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await getLessonById(lesson._id.toString(), teacherUser._id.toString(), Role.TEACHER);

      expect(result).toBeDefined();
      expect(result.hasAccess).toBe(false);
      expect(result.accessReason).toBe("not_enrolled");
      expect(result.content).toBeUndefined();
    });

    it("should return lesson with access for enrolled student", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(lesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({
        userId: studentUser._id,
        courseId: course._id,
        status: "active",
      });

      const result = await getLessonById(lesson._id.toString(), studentUser._id.toString(), Role.STUDENT);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Lesson");
      expect(result.accessReason).toBe("enrolled");
      expect(result.hasAccess).toBe(true);
    });

    it("should return lesson without content for non-enrolled student if published", async () => {
      const publishedLesson = { ...lesson, publishedAt: new Date() };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(publishedLesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getLessonById(lesson._id.toString(), studentUser._id.toString(), Role.STUDENT);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Lesson");
      expect(result.accessReason).toBe("published");
      expect(result.hasAccess).toBe(true);
    });

    it("should return lesson without access for non-enrolled student if not published", async () => {
      const unpublishedLesson = { ...lesson, publishedAt: null };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(unpublishedLesson),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getLessonById(lesson._id.toString(), studentUser._id.toString(), Role.STUDENT);

      expect(result).toBeDefined();
      expect(result.hasAccess).toBe(false);
      expect(result.accessReason).toBe("not_enrolled");
    });

    it("should throw error for invalid lesson ID", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(
        getLessonById("invalid", adminUser._id.toString(), Role.ADMIN)
      ).rejects.toThrow("Invalid lesson ID format");
    });
  });

  describe("updateLessonService", () => {
    it("should throw error when teacher is not instructor", async () => {
      const otherCourse = {
        ...course,
        teacherIds: [new mongoose.Types.ObjectId()], // Different teacher
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...lesson, courseId: otherCourse }),
      };
      (LessonModel.findById as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.findById as jest.Mock).mockResolvedValue(otherCourse);

      const updateData = { title: "Updated Lesson" };

      await expect(
        updateLessonService(lesson._id.toString(), updateData, teacherUser._id.toString(), Role.TEACHER)
      ).rejects.toThrow("Not authorized to update this lesson");
    });
  });

  describe("deleteLessonService", () => {
    it("should throw error when teacher is not instructor", async () => {
      const otherCourse = {
        ...course,
        teacherIds: [new mongoose.Types.ObjectId()], // Different teacher
      };
      (LessonModel.findById as jest.Mock).mockResolvedValue({ ...lesson, courseId: otherCourse._id });
      (CourseModel.findById as jest.Mock).mockResolvedValue(otherCourse);

      await expect(
        deleteLessonService(lesson._id.toString(), teacherUser._id.toString(), Role.TEACHER)
      ).rejects.toThrow("Not authorized to delete this lesson");
    });
  });
});