// Course Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";
import { CourseStatus } from "@/types/course.type";

// Set longer timeout for setup (MongoMemoryServer can be slow)
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/course.service", () => ({
  listCourses: jest.fn(),
  getCourseById: jest.fn(),
  getCourseBySlug: jest.fn(),
  createCourse: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
  restoreCourse: jest.fn(),
  permanentDeleteCourse: jest.fn(),
  getMyCourses: jest.fn(),
  getQuizzes: jest.fn(),
  completeCourse: jest.fn(),
  getCourseStatistics: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/course.schemas", () => ({
  listCoursesSchema: {
    parse: jest.fn(),
  },
  courseIdSchema: {
    parse: jest.fn(),
  },
  createCourseSchema: {
    parse: jest.fn(),
  },
  updateCourseSchema: {
    parse: jest.fn(),
  },
  getQuizzesSchema: {
    parse: jest.fn(),
  },
}));

// Import controller and services
import {
  listCoursesHandler,
  getCourseByIdHandler,
  getCourseBySlugHandler,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
  restoreCourseHandler,
  permanentDeleteCourseHandler,
  getMyCoursesHandler,
  getQuizzesHandler,
  completeCourseHandler,
  getCourseStatisticsHandler,
} from "@/controller/course.controller";
import * as courseService from "@/services/course.service";
import * as courseSchemas from "@/validators/course.schemas";

describe("📚 Course Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      userId: new mongoose.Types.ObjectId().toString(),
      role: Role.ADMIN,
      query: {},
      params: {},
      body: {},
      file: undefined,
    } as any;
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ====================================
  // LIST COURSES TESTS
  // ====================================
  describe("listCoursesHandler", () => {
    it("should list courses with pagination", async () => {
      const mockCourses = [
        { _id: "1", title: "Course 1", status: CourseStatus.DRAFT },
        { _id: "2", title: "Course 2", status: CourseStatus.ONGOING },
      ];
      const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: mockCourses,
        pagination: mockPagination,
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        slug: undefined,
        from: undefined,
        to: undefined,
        subjectId: undefined,
        semesterId: undefined,
        teacherId: undefined,
        isPublished: undefined,
        status: undefined,
        includeDeleted: undefined,
        onlyDeleted: undefined,
        sortBy: undefined,
        sortOrder: undefined,
        userRole: Role.ADMIN,
        userId: mockReq.userId, // ✅ NEW: userId should be passed
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCourses,
        message: "Courses retrieved successfully",
        pagination: mockPagination,
      });
    });

    it("should filter courses by search term", async () => {
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        search: "Programming",
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Programming" })
      );
    });

    it("should filter by subject ID", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        subjectId,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId })
      );
    });

    it("should handle includeDeleted parameter for admin", async () => {
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        includeDeleted: true,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ includeDeleted: true })
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.listCourses as jest.Mock).mockRejectedValue(error);

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should pass userId to service for isTeacherOfCourse calculation", async () => {
      const mockCourses = [
        { _id: "1", title: "Course 1", isTeacherOfCourse: true },
        { _id: "2", title: "Course 2", isTeacherOfCourse: false },
      ];
      const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: mockCourses,
        pagination: mockPagination,
      });

      mockReq.userId = new mongoose.Types.ObjectId().toString() as any;
      mockReq.role = Role.TEACHER;

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      // Verify userId is passed to service
      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockReq.userId,
          userRole: Role.TEACHER,
        })
      );

      // Verify response includes courses with isTeacherOfCourse field
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCourses,
        message: "Courses retrieved successfully",
        pagination: mockPagination,
      });
    });
  });

  // ====================================
  // GET COURSE BY ID TESTS
  // ====================================
  describe("getCourseByIdHandler", () => {
    it("should get course by ID successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockCourse = { _id: courseId, title: "Test Course" };

      mockReq.params = { id: courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.getCourseById as jest.Mock).mockResolvedValue(mockCourse);

      await getCourseByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.getCourseById).toHaveBeenCalledWith(courseId, mockReq.userId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCourse,
        message: "Course retrieved successfully",
      });
    });

    it("should handle invalid course ID", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid course ID format");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getCourseByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle course not found", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error("Course not found");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.getCourseById as jest.Mock).mockRejectedValue(error);

      await getCourseByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // CREATE COURSE TESTS
  // ====================================
  describe("createCourseHandler", () => {
    it("should create course successfully", async () => {
      const courseData = {
        title: "New Course",
        subjectId: new mongoose.Types.ObjectId().toString(),
        teacherIds: [new mongoose.Types.ObjectId().toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
      };
      const mockCreatedCourse = { _id: "1", ...courseData };

      mockReq.body = courseData;
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockReturnValue(courseData);
      (courseService.createCourse as jest.Mock).mockResolvedValue({ course: mockCreatedCourse, warnings: [] });

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.createCourse).toHaveBeenCalledWith(
        courseData,
        mockReq.userId,
        undefined // no logo file
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        data: mockCreatedCourse,
        message: "Course created successfully",
      });
    });

    it("should create course with logo file", async () => {
      const courseData = {
        title: "New Course",
        subjectId: new mongoose.Types.ObjectId().toString(),
        teacherIds: [new mongoose.Types.ObjectId().toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
      };
      const logoFile = {
        filename: "logo.png",
        mimetype: "image/png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;
      const mockCreatedCourse = { _id: "1", ...courseData, logo: "http://test.com/logo.png" };

      mockReq.body = courseData;
      mockReq.file = logoFile;
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockReturnValue(courseData);
      (courseService.createCourse as jest.Mock).mockResolvedValue({ course: mockCreatedCourse, warnings: [] });

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.createCourse).toHaveBeenCalledWith(
        courseData,
        mockReq.userId,
        logoFile
      );
    });

    it("should handle validation errors", async () => {
      mockReq.body = { title: "" }; // Invalid data
      const validationError = new Error("Validation failed");
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle service errors", async () => {
      const courseData = {
        title: "New Course",
        subjectId: new mongoose.Types.ObjectId().toString(),
        teacherIds: [new mongoose.Types.ObjectId().toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
      };
      mockReq.body = courseData;
      const error = new Error("Service error");
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockReturnValue(courseData);
      (courseService.createCourse as jest.Mock).mockRejectedValue(error);

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should include warnings in response when service returns warnings", async () => {
      const courseData = {
        title: "New Course",
        subjectId: new mongoose.Types.ObjectId().toString(),
        teacherIds: [new mongoose.Types.ObjectId().toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
      };
      const mockCreatedCourse = { _id: "1", ...courseData };
      const warnings = ["Failed to send notifications: Network error"];

      mockReq.body = courseData;
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockReturnValue(courseData);
      (courseService.createCourse as jest.Mock).mockResolvedValue({
        course: mockCreatedCourse,
        warnings
      });

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(201, {
        data: mockCreatedCourse,
        message: "Course created successfully",
        warnings,
      });
    });

    it("should not include warnings field when warnings array is empty", async () => {
      const courseData = {
        title: "New Course",
        subjectId: new mongoose.Types.ObjectId().toString(),
        teacherIds: [new mongoose.Types.ObjectId().toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
      };
      const mockCreatedCourse = { _id: "1", ...courseData };

      mockReq.body = courseData;
      (courseSchemas.createCourseSchema.parse as jest.Mock).mockReturnValue(courseData);
      (courseService.createCourse as jest.Mock).mockResolvedValue({
        course: mockCreatedCourse,
        warnings: []
      });

      await createCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(201, {
        data: mockCreatedCourse,
        message: "Course created successfully",
        // No warnings field should be present
      });
      // Verify warnings field is not in the response
      const responseCall = (mockRes.success as jest.Mock).mock.calls[0][1];
      expect(responseCall).not.toHaveProperty("warnings");
    });
  });

  // ====================================
  // UPDATE COURSE TESTS
  // ====================================
  describe("updateCourseHandler", () => {
    it("should update course successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Course" };
      const mockUpdatedCourse = { _id: courseId, ...updateData };

      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockResolvedValue({ course: mockUpdatedCourse, warnings: [] });

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.updateCourse).toHaveBeenCalledWith(
        courseId,
        updateData,
        mockReq.userId,
        undefined // no logo file
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockUpdatedCourse,
        message: "Course updated successfully",
      });
    });

    it("should update course with logo file", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Course" };
      const logoFile = {
        filename: "new-logo.png",
        mimetype: "image/png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;
      const mockUpdatedCourse = { _id: courseId, ...updateData, logo: "http://test.com/new-logo.png" };

      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      mockReq.file = logoFile;
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockResolvedValue({ course: mockUpdatedCourse, warnings: [] });

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.updateCourse).toHaveBeenCalledWith(
        courseId,
        updateData,
        mockReq.userId,
        logoFile
      );
    });

    it("should handle partial update", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { description: "Updated description" };

      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockResolvedValue({
        course: { _id: courseId, ...updateData },
        warnings: [],
      });

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.updateCourse).toHaveBeenCalledWith(
        courseId,
        updateData,
        mockReq.userId,
        undefined
      );
    });

    it("should handle authorization errors", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Course" };
      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      mockReq.role = Role.STUDENT; // Student cannot update
      const error = new Error("You don't have permission to update this course");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockRejectedValue(error);

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should include warnings in response when service returns warnings", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Course" };
      const mockUpdatedCourse = { _id: courseId, ...updateData };
      const warnings = ["Failed to send notification to some teachers"];

      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockResolvedValue({
        course: mockUpdatedCourse,
        warnings
      });

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockUpdatedCourse,
        message: "Course updated successfully",
        warnings,
      });
    });

    it("should not include warnings field when warnings array is empty", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: "Updated Course" };
      const mockUpdatedCourse = { _id: courseId, ...updateData };

      mockReq.params = { id: courseId };
      mockReq.body = updateData;
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseSchemas.updateCourseSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseService.updateCourse as jest.Mock).mockResolvedValue({
        course: mockUpdatedCourse,
        warnings: []
      });

      await updateCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockUpdatedCourse,
        message: "Course updated successfully",
      });
      // Verify warnings field is not in the response
      const responseCall = (mockRes.success as jest.Mock).mock.calls[0][1];
      expect(responseCall).not.toHaveProperty("warnings");
    });
  });

  // ====================================
  // DELETE COURSE TESTS
  // ====================================
  describe("deleteCourseHandler", () => {
    it("should soft delete course successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockResult = {
        message: "Course deleted successfully",
        deletedAt: new Date(),
        deletedBy: mockReq.userId,
      };

      mockReq.params = { id: courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.deleteCourse as jest.Mock).mockResolvedValue(mockResult);

      await deleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.deleteCourse).toHaveBeenCalledWith(courseId, mockReq.userId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: null,
        message: mockResult.message,
      });
    });

    it("should handle course not found", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error("Course not found or already deleted");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.deleteCourse as jest.Mock).mockRejectedValue(error);

      await deleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle ongoing course deletion error", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error("Cannot delete an ongoing course");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.deleteCourse as jest.Mock).mockRejectedValue(error);

      await deleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // RESTORE COURSE TESTS
  // ====================================
  describe("restoreCourseHandler", () => {
    it("should restore deleted course successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockResult = {
        message: "Course restored successfully",
        course: { _id: courseId, title: "Restored Course", isDeleted: false },
      };

      mockReq.params = { id: courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.restoreCourse as jest.Mock).mockResolvedValue(mockResult);

      await restoreCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.restoreCourse).toHaveBeenCalledWith(courseId, mockReq.userId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockResult.course,
        message: mockResult.message,
      });
    });

    it("should handle non-admin restore attempt", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      mockReq.role = Role.TEACHER; // Teacher cannot restore
      const error = new Error("Only administrators can restore deleted courses");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.restoreCourse as jest.Mock).mockRejectedValue(error);

      await restoreCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle deleted course not found", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error("Deleted course not found");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.restoreCourse as jest.Mock).mockRejectedValue(error);

      await restoreCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // PERMANENT DELETE COURSE TESTS
  // ====================================
  describe("permanentDeleteCourseHandler", () => {
    it("should permanently delete course successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockResult = {
        message: "Course permanently deleted successfully",
        warning: "This action cannot be undone",
        deletedCourseId: courseId,
      };

      mockReq.params = { id: courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.permanentDeleteCourse as jest.Mock).mockResolvedValue(mockResult);

      await permanentDeleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.permanentDeleteCourse).toHaveBeenCalledWith(
        courseId,
        mockReq.userId
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: null,
        message: mockResult.message,
        warning: mockResult.warning,
        deletedCourseId: mockResult.deletedCourseId,
      });
    });

    it("should handle non-admin permanent delete attempt", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      mockReq.role = Role.TEACHER; // Teacher cannot permanently delete
      const error = new Error("Only administrators can permanently delete courses");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.permanentDeleteCourse as jest.Mock).mockRejectedValue(error);

      await permanentDeleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle course not in recycle bin", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error("Course not found in recycle bin");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.permanentDeleteCourse as jest.Mock).mockRejectedValue(error);

      await permanentDeleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle course with enrollments", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: courseId };
      const error = new Error(
        "Cannot permanently delete course with 3 enrollment(s)"
      );
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.permanentDeleteCourse as jest.Mock).mockRejectedValue(error);

      await permanentDeleteCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET MY COURSES TESTS
  // ====================================
  describe("getMyCoursesHandler", () => {
    it("should get my courses successfully", async () => {
      const mockCourses = [{ _id: "1", title: "My Course" }];
      const mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.getMyCourses as jest.Mock).mockResolvedValue({
        courses: mockCourses,
        pagination: mockPagination,
      });

      await getMyCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.getMyCourses).toHaveBeenCalledWith({
        userId: mockReq.userId,
        userRole: mockReq.role,
        params: expect.objectContaining({ page: 1, limit: 10 }),
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCourses,
        message: "My courses retrieved successfully",
        pagination: mockPagination,
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.getMyCourses as jest.Mock).mockRejectedValue(error);

      await getMyCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET COURSE BY SLUG TESTS
  // ====================================
  describe("getCourseBySlugHandler", () => {
    it("should get course by slug successfully", async () => {
      const mockCourse = { _id: "1", title: "Test Course", slug: "test-course" };
      mockReq.params = { slug: "test-course" };
      (courseService.getCourseBySlug as jest.Mock).mockResolvedValue(mockCourse);

      await getCourseBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.getCourseBySlug).toHaveBeenCalledWith("test-course");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockCourse,
        message: "Course retrieved successfully",
      });
    });

    it("should handle course not found", async () => {
      mockReq.params = { slug: "non-existent" };
      const error = new Error("Course not found");
      (courseService.getCourseBySlug as jest.Mock).mockRejectedValue(error);

      await getCourseBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET QUIZZES TESTS
  // ====================================
  describe("getQuizzesHandler", () => {
    it("should get quizzes successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockQuizzes = [{ _id: "1", title: "Quiz 1" }];
      const mockPagination = { page: 1, limit: 10, total: 1 };

      mockReq.params = { courseId };
      mockReq.query = { page: "1", limit: "10" };
      (courseSchemas.getQuizzesSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
      });
      (courseService.getQuizzes as jest.Mock).mockResolvedValue({
        quizzes: mockQuizzes,
        pagination: mockPagination,
      });

      await getQuizzesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.getQuizzes).toHaveBeenCalled();
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockQuizzes,
        pagination: mockPagination,
        message: "Quizzes retrieved successfully",
      });
    });

    it("should handle service errors", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      mockReq.query = {};
      const error = new Error("Service error");
      (courseSchemas.getQuizzesSchema.parse as jest.Mock).mockReturnValue({ courseId });
      (courseService.getQuizzes as jest.Mock).mockRejectedValue(error);

      await getQuizzesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // COMPLETE COURSE TESTS
  // ====================================
  describe("completeCourseHandler", () => {
    it("should complete course successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockData = { completed: true, statistics: {} };

      mockReq.params = { courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.completeCourse as jest.Mock).mockResolvedValue(mockData);

      await completeCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.completeCourse).toHaveBeenCalledWith(courseId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockData,
        message: "Course completed successfully",
      });
    });

    it("should handle service errors", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const error = new Error("Cannot complete course");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.completeCourse as jest.Mock).mockRejectedValue(error);

      await completeCourseHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET COURSE STATISTICS TESTS
  // ====================================
  describe("getCourseStatisticsHandler", () => {
    it("should get course statistics successfully", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockData = { statistics: { totalStudents: 10, avgScore: 85 } };

      mockReq.params = { courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.getCourseStatistics as jest.Mock).mockResolvedValue(mockData);

      await getCourseStatisticsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.getCourseStatistics).toHaveBeenCalledWith(
        courseId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockData,
        message: "Course statistics retrieved successfully",
      });
    });

    it("should handle no statistics available", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockData = { statistics: null, message: "No statistics available" };

      mockReq.params = { courseId };
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.getCourseStatistics as jest.Mock).mockResolvedValue(mockData);

      await getCourseStatisticsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockData,
        message: "No statistics available",
      });
    });

    it("should handle service errors", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { courseId };
      const error = new Error("Service error");
      (courseSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
      (courseService.getCourseStatistics as jest.Mock).mockRejectedValue(error);

      await getCourseStatisticsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // ERROR HANDLING TESTS
  // ====================================
  describe("Error Handling", () => {
    it("should handle missing userId in request", async () => {
      mockReq.userId = undefined;
      mockReq.role = undefined;
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      // Service should be called with undefined userId
      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ userRole: undefined })
      );
    });

    it("should handle missing role in request", async () => {
      mockReq.role = undefined;
      (courseSchemas.listCoursesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (courseService.listCourses as jest.Mock).mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listCoursesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(courseService.listCourses).toHaveBeenCalledWith(
        expect.objectContaining({ userRole: undefined })
      );
    });
  });
});

