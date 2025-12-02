
// Unit tests for enrollment.service.ts
import {
  getEnrollmentById,
  getStudentEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  createEnrollment,
  updateEnrollment,
  updateSelfEnrollment,
  kickStudentFromCourse,
  getEnrollmentStatistics,
} from "@/services/enrollment.service";
import EnrollmentModel from "@/models/enrollment.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import SubjectModel from "@/models/subject.model";
import { AppError } from "@/utils/AppError";
import { CourseStatus } from "@/types/course.type";
import {
  EnrollmentStatus,
  EnrollmentRole,
  EnrollmentMethod,
} from "@/types/enrollment.type";
import { Role } from "@/types/user.type";
import { Types } from "mongoose";
import QuizModel from "@/models/quiz.model";
import AssignmentModel from "@/models/assignment.model";
import QuizAttemptModel from "@/models/quizAttempt.model";
import SubmissionModel from "@/models/submission.model";

jest.mock("@/models/enrollment.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/models/subject.model");
jest.mock("@/models/quiz.model");
jest.mock("@/models/assignment.model");
jest.mock("@/models/quizAttempt.model");
jest.mock("@/models/submission.model");
jest.mock("@/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/utils/bcrypt", () => ({
  compareValue: jest.fn(),
}));

describe("Enrollment Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEnrollmentById", () => {
    it("Should return enrollment when found", async () => {
      const mockEnrollment = { _id: "enroll123", studentId: "user123" };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      const result = await getEnrollmentById("enroll123");

      expect(result).toEqual(mockEnrollment);
    });

    it("Should throw NOT_FOUND when enrollment does not exist", async () => {
      const mockPopulateChain = { populate: jest.fn().mockReturnThis() };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(null);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(getEnrollmentById("enroll123")).rejects.toThrow(AppError);
    });
  });

  describe("getStudentEnrollments", () => {
    it("Should return paginated student enrollments with filters", async () => {
      const mockEnrollments = [{ _id: "enroll1" }, { _id: "enroll2" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(25);

      const result = await getStudentEnrollments({
        studentId: "student123",
        status: EnrollmentStatus.APPROVED,
        page: 2,
        limit: 10,
      });

      expect(EnrollmentModel.find).toHaveBeenCalledWith({
        studentId: "student123",
        status: EnrollmentStatus.APPROVED,
      });
      expect(result.enrollments).toEqual(mockEnrollments);
      expect(result.pagination.totalPages).toBe(3);
      expect(mockFind.skip).toHaveBeenCalledWith(10);
    });

    it("Should filter by date range (from and to)", async () => {
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-12-31");

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getStudentEnrollments({
        studentId: "student123",
        from: fromDate,
        to: toDate,
      });

      expect(EnrollmentModel.find).toHaveBeenCalledWith({
        studentId: "student123",
        createdAt: { $gte: fromDate, $lte: toDate },
      });
      expect(result.enrollments).toHaveLength(1);
    });
  });

  describe("getCourseEnrollments", () => {
    it("Should return course enrollments when course exists", async () => {
      const mockCourse = { _id: "course123", title: "Test Course" };
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getCourseEnrollments({ courseId: "course123" });

      expect(result.enrollments).toEqual(mockEnrollments);
    });

    it("Should throw NOT_FOUND when course does not exist", async () => {
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(getCourseEnrollments({ courseId: "course123" })).rejects.toThrow(AppError);
    });

    it("Should filter by status and date range", async () => {
      const mockCourse = { _id: "course123", title: "Test Course" };
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-12-31");

      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getCourseEnrollments({
        courseId: "course123",
        status: EnrollmentStatus.APPROVED,
        from: fromDate,
        to: toDate,
      });

      expect(EnrollmentModel.find).toHaveBeenCalledWith({
        courseId: "course123",
        status: EnrollmentStatus.APPROVED,
        createdAt: { $gte: fromDate, $lte: toDate },
      });
      expect(result.enrollments).toHaveLength(1);
    });
  });

  describe("getAllEnrollments", () => {
    it("Should return all enrollments with correct data format", async () => {
      const mockEnrollments = [
        { _id: "enroll1", studentId: "student1", courseId: "course1", status: EnrollmentStatus.APPROVED },
        { _id: "enroll2", studentId: "student2", courseId: "course2", status: EnrollmentStatus.PENDING },
      ];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(2);

      const result = await getAllEnrollments({ page: 1, limit: 10 });

      expect(result).toHaveProperty("enrollments");
      expect(result).toHaveProperty("pagination");
      expect(result.enrollments).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("Should filter by status correctly", async () => {
      const mockEnrollments = [
        { _id: "enroll1", status: EnrollmentStatus.APPROVED },
      ];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getAllEnrollments({ status: EnrollmentStatus.APPROVED, page: 1, limit: 10 });

      expect(EnrollmentModel.find).toHaveBeenCalledWith({ status: EnrollmentStatus.APPROVED });
      expect(result.enrollments).toHaveLength(1);
    });

    it("Should handle pagination correctly", async () => {
      const mockEnrollments = [{ _id: "enroll3" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(25);

      const result = await getAllEnrollments({ page: 3, limit: 10 });

      expect(mockFind.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(mockFind.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it("Should return empty array when no enrollments found", async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

      const result = await getAllEnrollments({ page: 1, limit: 10 });

      expect(result.enrollments).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it("Should throw FORBIDDEN when viewer role is not ADMIN or TEACHER", async () => {
      await expect(
        getAllEnrollments({ page: 1, limit: 10 }, { role: Role.STUDENT, userId: "student123" })
      ).rejects.toThrow(AppError);
    });

    it("Should filter by teacher courses when viewer is TEACHER", async () => {
      const teacherId = new Types.ObjectId();
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };
      const mockCourseFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "course1" }, { _id: "course2" }]),
      };

      (CourseModel.find as jest.Mock) = jest.fn().mockReturnValue(mockCourseFind);
      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getAllEnrollments({ page: 1, limit: 10 }, { role: Role.TEACHER, userId: teacherId });

      expect(result.enrollments).toHaveLength(1);
    });

    it("Should throw FORBIDDEN when teacher tries to access other course enrollments", async () => {
      const teacherId = new Types.ObjectId();
      const mockCourseFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "course1" }]),
      };

      (CourseModel.find as jest.Mock) = jest.fn().mockReturnValue(mockCourseFind);

      await expect(
        getAllEnrollments({ courseId: "course999", page: 1, limit: 10 }, { role: Role.TEACHER, userId: teacherId })
      ).rejects.toThrow(AppError);
    });

    it("Should filter by courseId when viewer is ADMIN", async () => {
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getAllEnrollments(
        { courseId: "course123", page: 1, limit: 10 },
        { role: Role.ADMIN, userId: "admin123" }
      );

      expect(EnrollmentModel.find).toHaveBeenCalledWith(expect.objectContaining({ courseId: "course123" }));
      expect(result.enrollments).toHaveLength(1);
    });

    it("Should filter by date range and studentId", async () => {
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-12-31");

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getAllEnrollments({
        studentId: "student123",
        from: fromDate,
        to: toDate,
        page: 1,
        limit: 10,
      });

      expect(EnrollmentModel.find).toHaveBeenCalledWith({
        studentId: "student123",
        createdAt: { $gte: fromDate, $lte: toDate },
      });
      expect(result.enrollments).toHaveLength(1);
    });

    it("Should allow teacher to access their own course enrollments", async () => {
      const teacherId = new Types.ObjectId();
      const mockEnrollments = [{ _id: "enroll1" }];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockEnrollments),
      };
      const mockCourseFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "course123" }]),
      };

      (CourseModel.find as jest.Mock) = jest.fn().mockReturnValue(mockCourseFind);
      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await getAllEnrollments(
        { courseId: "course123", page: 1, limit: 10 },
        { role: Role.TEACHER, userId: teacherId }
      );

      expect(result.enrollments).toHaveLength(1);
    });
  });

  describe("createEnrollment", () => {
    const mockStudentId = "student123";
    const mockCourseId = "course123";
    const mockSubjectId = "subject123";

    // Helper to setup common mocks for createEnrollment tests
    const setupSubjectMock = (prerequisites: string[] = []) => {
      const mockSubject = { _id: mockSubjectId, prerequisites };
      (SubjectModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockSubject);
    };

    const setupFindOneSortMock = (returnValue: any) => {
      const mockSort = { sort: jest.fn().mockResolvedValue(returnValue) };
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockSort);
    };

    it("Should create enrollment successfully", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        capacity: null,
      };
      const mockEnrollment = {
        _id: "enroll123",
        populate: jest.fn().mockResolvedValue({ _id: "enroll123", studentId: mockStudent, courseId: mockCourse }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(null);
      (EnrollmentModel.create as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);

      const result = await createEnrollment({ studentId: mockStudentId, courseId: mockCourseId });

      expect(EnrollmentModel.create).toHaveBeenCalledWith({
        studentId: mockStudentId,
        courseId: mockCourseId,
        status: EnrollmentStatus.APPROVED,
        role: EnrollmentRole.STUDENT,
        method: EnrollmentMethod.SELF,
      });
      expect(result).toBeDefined();
    });

    it("Should throw NOT_FOUND when student or course does not exist", async () => {
      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is not ongoing", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = { _id: mockCourseId, status: CourseStatus.DRAFT };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw CONFLICT when already enrolled", async () => {
      const mockStudent = { _id: mockStudentId, username: "testuser" };
      const mockCourse = { _id: mockCourseId, subjectId: mockSubjectId, status: CourseStatus.ONGOING };
      const existingEnrollment = { _id: "existing123", status: EnrollmentStatus.APPROVED };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is full", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        capacity: 10,
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(null);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(10);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should set status to PENDING when enrollRequiresApproval is true", async () => {
      const mockStudent = { _id: mockStudentId };
      const teacherId = new Types.ObjectId();
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: true,
        capacity: null,
        teacherIds: [teacherId],
      };
      const mockEnrollment = {
        _id: "enroll123",
        courseId: { _id: mockCourseId, title: "Test Course" },
        studentId: { _id: mockStudentId, username: "testuser" },
        populate: jest.fn().mockResolvedValue({
          _id: "enroll123",
          courseId: { _id: mockCourseId, title: "Test Course" },
          studentId: { _id: mockStudentId, username: "testuser" },
        }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      // Mock CourseModel.findById to handle both regular call and .select() call
      const mockSelect = jest.fn().mockResolvedValue({ _id: mockCourseId, teacherIds: [teacherId] });
      (CourseModel.findById as jest.Mock) = jest.fn().mockImplementation(() => ({
        ...mockCourse,
        select: mockSelect,
      }));
      // Also need to return the course directly for the first call
      (CourseModel.findById as jest.Mock).mockResolvedValueOnce(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(null);
      (EnrollmentModel.create as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);

      await createEnrollment({ studentId: mockStudentId, courseId: mockCourseId });

      expect(EnrollmentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: EnrollmentStatus.PENDING })
      );
    });

    it("Should throw UNAUTHORIZED when password is incorrect", async () => {
      const { compareValue } = require("@/utils/bcrypt");
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollPasswordHash: "hashedPassword",
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      compareValue.mockResolvedValue(false);

      await expect(
        createEnrollment({
          studentId: mockStudentId,
          courseId: mockCourseId,
          password: "wrongPassword",
          method: EnrollmentMethod.SELF,
        })
      ).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when prerequisite not completed", async () => {
      const prerequisiteSubjectId = "prereq123";
      const mockStudent = { _id: mockStudentId, username: "testuser" };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
      };
      const mockSubject = { _id: mockSubjectId, prerequisites: [prerequisiteSubjectId] };
      const mockPrerequisiteSubject = { _id: prerequisiteSubjectId, name: "Math 101" };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (SubjectModel.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce(mockPrerequisiteSubject);
      (CourseModel.find as jest.Mock) = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: "prereqCourse1" }]),
      });
      (EnrollmentModel.exists as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should allow re-enrollment when previous enrollment was REJECTED", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
      };
      const existingEnrollment = {
        _id: "existing123",
        status: EnrollmentStatus.REJECTED,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: "existing123",
          studentId: mockStudent,
          courseId: mockCourse,
        }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);

      const result = await createEnrollment({ studentId: mockStudentId, courseId: mockCourseId });

      expect(existingEnrollment.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("Should verify password for re-enrollment on password-protected course", async () => {
      const { compareValue } = require("@/utils/bcrypt");
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        enrollPasswordHash: "hashedPassword",
      };
      const existingEnrollment = {
        _id: "existing123",
        status: EnrollmentStatus.CANCELLED,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: "existing123",
          studentId: mockStudent,
          courseId: mockCourse,
        }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(1);
      compareValue.mockResolvedValue(true);

      const result = await createEnrollment({
        studentId: mockStudentId,
        courseId: mockCourseId,
        password: "correctPassword",
        method: EnrollmentMethod.SELF,
      });

      expect(existingEnrollment.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("Should throw BAD_REQUEST when re-enrolling within cooldown period", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
      };
      const existingEnrollment = {
        _id: "existing123",
        status: EnrollmentStatus.CANCELLED,
        createdAt: new Date(), // Just now - within cooldown
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);

      await expect(
        createEnrollment({ studentId: mockStudentId, courseId: mockCourseId, method: EnrollmentMethod.SELF })
      ).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when daily enrollment limit reached", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
      };
      const existingEnrollment = {
        _id: "existing123",
        status: EnrollmentStatus.CANCELLED,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago - past cooldown
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(5); // Daily limit reached

      await expect(
        createEnrollment({ studentId: mockStudentId, courseId: mockCourseId, method: EnrollmentMethod.SELF })
      ).rejects.toThrow(AppError);
    });

    it("Should send notification when enrollment created by admin/teacher", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        subjectId: mockSubjectId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        capacity: null,
      };
      const mockEnrollment = {
        _id: "enroll123",
        courseId: { _id: mockCourseId, title: "Test Course" },
        studentId: { _id: mockStudentId, username: "testuser" },
        populate: jest.fn().mockResolvedValue({
          _id: "enroll123",
          courseId: { _id: mockCourseId, title: "Test Course" },
          studentId: { _id: mockStudentId, username: "testuser" },
        }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(null);
      (EnrollmentModel.create as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);

      const result = await createEnrollment({
        studentId: mockStudentId,
        courseId: mockCourseId,
        method: EnrollmentMethod.INVITED,
      });

      expect(result).toBeDefined();
    });

    it("Should throw CONFLICT when enrollment status is DROPPED", async () => {
      const mockStudent = { _id: mockStudentId, username: "testuser" };
      const mockCourse = { _id: mockCourseId, subjectId: mockSubjectId, status: CourseStatus.ONGOING };
      const existingEnrollment = { _id: "existing123", status: EnrollmentStatus.DROPPED };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw CONFLICT when enrollment status is COMPLETED", async () => {
      const mockStudent = { _id: mockStudentId, username: "testuser" };
      const mockCourse = { _id: mockCourseId, subjectId: mockSubjectId, status: CourseStatus.ONGOING };
      const existingEnrollment = { _id: "existing123", status: EnrollmentStatus.COMPLETED };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw CONFLICT when enrollment status is PENDING", async () => {
      const mockStudent = { _id: mockStudentId, username: "testuser" };
      const mockCourse = { _id: mockCourseId, subjectId: mockSubjectId, status: CourseStatus.ONGOING };
      const existingEnrollment = { _id: "existing123", status: EnrollmentStatus.PENDING };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      setupSubjectMock([]);
      setupFindOneSortMock(existingEnrollment);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });
  });

  describe("updateEnrollment", () => {
    it("Should update enrollment successfully", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000), // Tomorrow
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.COMPLETED,
        finalGrade: 85,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED, finalGrade: 85 });

      expect(result).toEqual(updatedEnrollment);
    });

    it("Should throw NOT_FOUND when enrollment does not exist", async () => {
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(null),
      };
      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED })).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is completed", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.COMPLETED,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED })).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is expired", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() - 86400000), // Yesterday
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED })).rejects.toThrow(AppError);
    });
  });

  describe("updateSelfEnrollment", () => {
    it("Should allow student to cancel their enrollment", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000), // Tomorrow
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce({ ...mockEnrollment, status: EnrollmentStatus.CANCELLED });

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED });

      expect(result!.status).toBe(EnrollmentStatus.CANCELLED);
    });

    it("Should throw NOT_FOUND when enrollment not found or access denied", async () => {
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(null),
      };
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should not allow canceling completed enrollment", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.COMPLETED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should not allow canceling dropped enrollment", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.DROPPED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should not allow canceling rejected enrollment", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.REJECTED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should not allow canceling already cancelled enrollment", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.CANCELLED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is completed", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.COMPLETED,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is expired", async () => {
      const mockCourse = {
        _id: "course123",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() - 86400000), // Yesterday
      };
      const mockEnrollment = {
        _id: "enroll123",
        studentId: "student123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });
  });

  describe("updateEnrollment - notification branches", () => {
    it("Should send notification when status changes to REJECTED", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.REJECTED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { status: EnrollmentStatus.REJECTED, note: "Not eligible" });

      expect(result?.status).toBe(EnrollmentStatus.REJECTED);
    });

    it("Should send notification when status changes to APPROVED", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { status: EnrollmentStatus.APPROVED });

      expect(result?.status).toBe(EnrollmentStatus.APPROVED);
    });

    it("Should set droppedAt when status changes to DROPPED", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.DROPPED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { status: EnrollmentStatus.DROPPED });

      expect(result?.status).toBe(EnrollmentStatus.DROPPED);
      expect(EnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "enroll123",
        expect.objectContaining({ droppedAt: expect.any(Date) }),
        { new: true }
      );
    });

    it("Should update role and finalGrade without status change", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        role: EnrollmentRole.AUDITOR,
        finalGrade: 90,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { role: EnrollmentRole.AUDITOR, finalGrade: 90 });

      expect(result?.role).toBe(EnrollmentRole.AUDITOR);
      expect(result?.finalGrade).toBe(90);
    });

    it("Should set respondedBy when provided with status change", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        status: CourseStatus.ONGOING,
        endDate: new Date(Date.now() + 86400000),
      };
      const mockStudent = {
        _id: "student123",
        username: "testuser",
      };
      const mockEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const updatedEnrollment = {
        _id: "enroll123",
        status: EnrollmentStatus.APPROVED,
        respondedBy: "admin123",
        courseId: mockCourse,
        studentId: mockStudent,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", {
        status: EnrollmentStatus.APPROVED,
        respondedBy: "admin123",
      });

      expect(result?.status).toBe(EnrollmentStatus.APPROVED);
      expect(EnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "enroll123",
        expect.objectContaining({ respondedBy: "admin123" }),
        { new: true }
      );
    });
  });

  describe("kickStudentFromCourse", () => {
    const mockUserId = new Types.ObjectId();
    const mockEnrollmentId = "enroll123";

    it("Should kick student successfully as admin", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        teacherIds: [],
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "student123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        note: "",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUser = { _id: mockUserId, username: "admin" };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await kickStudentFromCourse(mockEnrollmentId, "Violation", mockUserId, Role.ADMIN);

      expect(result.message).toBe("Student kicked successfully");
      expect(mockEnrollment.status).toBe(EnrollmentStatus.DROPPED);
      expect(mockEnrollment.save).toHaveBeenCalled();
    });

    it("Should kick student successfully as teacher of the course", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        teacherIds: [mockUserId],
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "student123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
        note: "Previous note",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };
      const mockUser = { _id: mockUserId, username: "teacher1" };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      (UserModel.findById as jest.Mock) = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await kickStudentFromCourse(mockEnrollmentId, "Bad behavior", mockUserId, Role.TEACHER);

      expect(result.message).toBe("Student kicked successfully");
      expect(mockEnrollment.note).toContain("Bad behavior");
    });

    it("Should throw NOT_FOUND when enrollment does not exist", async () => {
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(null),
      };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(kickStudentFromCourse(mockEnrollmentId, "Reason", mockUserId, Role.ADMIN)).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        teacherIds: [otherTeacherId],
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "student123",
        status: EnrollmentStatus.APPROVED,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(kickStudentFromCourse(mockEnrollmentId, "Reason", mockUserId, Role.TEACHER)).rejects.toThrow(
        AppError
      );
    });

    it("Should throw BAD_REQUEST when enrollment status is not APPROVED", async () => {
      const mockCourse = {
        _id: "course123",
        title: "Test Course",
        teacherIds: [],
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: "student123",
        status: EnrollmentStatus.PENDING,
        courseId: mockCourse,
      };
      const mockPopulateChain = {
        populate: jest.fn().mockResolvedValue(mockEnrollment),
      };

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(kickStudentFromCourse(mockEnrollmentId, "Reason", mockUserId, Role.ADMIN)).rejects.toThrow(AppError);
    });
  });

  describe("getEnrollmentStatistics", () => {
    const mockEnrollmentId = "enroll123";
    const mockUserId = new Types.ObjectId();
    const mockStudentId = new Types.ObjectId();
    const mockCourseId = new Types.ObjectId();

    const setupStatisticsMocks = () => {
      const mockQuizFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "quiz1", title: "Quiz 1" }]),
      };
      const mockAssignmentFind = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "assign1", title: "Assignment 1", maxScore: 100 }]),
      };
      const mockQuizAttemptFind = {
        lean: jest.fn().mockResolvedValue([{ quizId: "quiz1", studentId: mockStudentId, score: 80, status: "submitted" }]),
      };
      const mockSubmissionFind = {
        lean: jest.fn().mockResolvedValue([{ assignmentId: "assign1", studentId: mockStudentId, grade: 90, status: "graded" }]),
      };

      (QuizModel.find as jest.Mock) = jest.fn().mockReturnValue(mockQuizFind);
      (AssignmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockAssignmentFind);
      (QuizAttemptModel.find as jest.Mock) = jest.fn().mockReturnValue(mockQuizAttemptFind);
      (SubmissionModel.find as jest.Mock) = jest.fn().mockReturnValue(mockSubmissionFind);
    };

    it("Should return statistics for admin", async () => {
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.COMPLETED,
        teacherIds: [],
      };
      const mockStudent = {
        _id: mockStudentId,
        username: "student1",
        fullname: "Student One",
        email: "student@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.COMPLETED,
        finalGrade: 85,
        progress: {
          totalLessons: 10,
          completedLessons: 8,
          totalQuizzes: 2,
          completedQuizzes: 2,
          totalQuizScores: 160,
          totalAssignments: 1,
          completedAssignments: 1,
          totalAssignmentScores: 90,
          totalAttendances: 10,
          completedAttendances: 9,
        },
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      setupStatisticsMocks();

      const result = await getEnrollmentStatistics({
        enrollmentId: mockEnrollmentId,
        userId: mockUserId,
        role: Role.ADMIN,
      });

      expect(result.enrollmentId).toBe(mockEnrollmentId);
      expect(result.finalGrade).toBe(85);
      expect(result.summary).toBeDefined();
      expect(result.details).toBeDefined();
    });

    it("Should return statistics for student viewing own enrollment", async () => {
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.COMPLETED,
        teacherIds: [],
      };
      const mockStudent = {
        _id: mockStudentId,
        username: "student1",
        fullname: "Student One",
        email: "student@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.COMPLETED,
        progress: {},
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      setupStatisticsMocks();

      const result = await getEnrollmentStatistics({
        enrollmentId: mockEnrollmentId,
        userId: mockStudentId,
        role: Role.STUDENT,
      });

      expect(result.enrollmentId).toBe(mockEnrollmentId);
    });

    it("Should return statistics for teacher of the course", async () => {
      const teacherId = new Types.ObjectId();
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.COMPLETED,
        teacherIds: [teacherId],
      };
      const mockStudent = {
        _id: mockStudentId,
        username: "student1",
        fullname: "Student One",
        email: "student@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.COMPLETED,
        progress: {},
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);
      setupStatisticsMocks();

      const result = await getEnrollmentStatistics({
        enrollmentId: mockEnrollmentId,
        userId: teacherId,
        role: Role.TEACHER,
      });

      expect(result.enrollmentId).toBe(mockEnrollmentId);
    });

    it("Should throw NOT_FOUND when enrollment does not exist", async () => {
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(null);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        getEnrollmentStatistics({
          enrollmentId: mockEnrollmentId,
          userId: mockUserId,
          role: Role.ADMIN,
        })
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when student tries to view other's enrollment", async () => {
      const otherStudentId = new Types.ObjectId();
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.COMPLETED,
        teacherIds: [],
      };
      const mockStudent = {
        _id: otherStudentId,
        username: "other_student",
        fullname: "Other Student",
        email: "other@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.COMPLETED,
        progress: {},
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        getEnrollmentStatistics({
          enrollmentId: mockEnrollmentId,
          userId: mockStudentId,
          role: Role.STUDENT,
        })
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.COMPLETED,
        teacherIds: [otherTeacherId],
      };
      const mockStudent = {
        _id: mockStudentId,
        username: "student1",
        fullname: "Student One",
        email: "student@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.COMPLETED,
        progress: {},
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        getEnrollmentStatistics({
          enrollmentId: mockEnrollmentId,
          userId: mockUserId,
          role: Role.TEACHER,
        })
      ).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is not completed", async () => {
      const mockCourse = {
        _id: mockCourseId,
        title: "Test Course",
        code: "TC101",
        status: CourseStatus.ONGOING,
        teacherIds: [],
      };
      const mockStudent = {
        _id: mockStudentId,
        username: "student1",
        fullname: "Student One",
        email: "student@test.com",
        avatar_url: null,
      };
      const mockEnrollment = {
        _id: mockEnrollmentId,
        studentId: mockStudent,
        courseId: mockCourse,
        status: EnrollmentStatus.APPROVED,
        progress: {},
      };
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockPopulateChain.populate.mockReturnValueOnce(mockPopulateChain);
      mockPopulateChain.populate.mockResolvedValueOnce(mockEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue(mockPopulateChain);

      await expect(
        getEnrollmentStatistics({
          enrollmentId: mockEnrollmentId,
          userId: mockUserId,
          role: Role.ADMIN,
        })
      ).rejects.toThrow(AppError);
    });
  });
});
