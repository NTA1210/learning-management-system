
// Unit tests for enrollment.service.ts
import {
  getEnrollmentById,
  getStudentEnrollments,
  getCourseEnrollments,
  getAllEnrollments,
  createEnrollment,
  updateEnrollment,
  updateSelfEnrollment,
} from "@/services/enrollment.service";
import EnrollmentModel from "@/models/enrollment.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import { AppError } from "@/utils/AppError";
import { CourseStatus } from "@/types/course.type";
import {
  EnrollmentStatus,
  EnrollmentRole,
  EnrollmentMethod,
} from "@/types/enrollment.type";

jest.mock("@/models/enrollment.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
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
  });

  describe("getAllEnrollments", () => {
    it("Should return all enrollments with or without filters", async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);

      await getAllEnrollments({ status: EnrollmentStatus.APPROVED });

      expect(EnrollmentModel.find).toHaveBeenCalled();
    });
  });

  describe("createEnrollment", () => {
    const mockStudentId = "student123";
    const mockCourseId = "course123";

    it("Should create enrollment successfully", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
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
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
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
      const mockStudent = { _id: mockStudentId };
      const mockCourse = { _id: mockCourseId, status: CourseStatus.ONGOING };
      const existingEnrollment = { _id: "existing123", status: EnrollmentStatus.APPROVED };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(existingEnrollment);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when course is full", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: false,
        capacity: 10,
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
      (EnrollmentModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(10);

      await expect(createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })).rejects.toThrow(AppError);
    });

    it("Should set status to PENDING when enrollRequiresApproval is true", async () => {
      const mockStudent = { _id: mockStudentId };
      const mockCourse = {
        _id: mockCourseId,
        status: CourseStatus.ONGOING,
        enrollRequiresApproval: true,
        capacity: null,
      };
      const mockEnrollment = {
        _id: "enroll123",
        populate: jest.fn().mockResolvedValue({ _id: "enroll123" }),
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
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
        status: CourseStatus.ONGOING,
        enrollPasswordHash: "hashedPassword",
      };

      (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);
      (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockCourse);
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
  });

  describe("updateEnrollment", () => {
    it("Should update enrollment successfully", async () => {
      const mockEnrollment = { _id: "enroll123", status: EnrollmentStatus.APPROVED };
      const updatedEnrollment = { _id: "enroll123", status: EnrollmentStatus.COMPLETED, finalGrade: 85 };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED, finalGrade: 85 });

      expect(result).toEqual(updatedEnrollment);
    });

    it("Should throw NOT_FOUND when enrollment does not exist", async () => {
      (EnrollmentModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(updateEnrollment("enroll123", { status: EnrollmentStatus.COMPLETED })).rejects.toThrow(AppError);
    });
  });

  describe("updateSelfEnrollment", () => {
    it("Should allow student to cancel their enrollment", async () => {
      const mockEnrollment = { _id: "enroll123", studentId: "student123", status: EnrollmentStatus.PENDING };
      const mockUpdate = { populate: jest.fn().mockReturnThis() };
      mockUpdate.populate.mockReturnValueOnce(mockUpdate);
      mockUpdate.populate.mockResolvedValueOnce({ ...mockEnrollment, status: EnrollmentStatus.CANCELLED });

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);
      (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest.fn().mockReturnValue(mockUpdate);

      const result = await updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED });

      expect(result!.status).toBe(EnrollmentStatus.CANCELLED);
    });

    it("Should throw NOT_FOUND when enrollment not found or access denied", async () => {
      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });

    it("Should not allow canceling completed or dropped enrollment", async () => {
      const mockEnrollment = { _id: "enroll123", studentId: "student123", status: EnrollmentStatus.COMPLETED };

      (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockEnrollment);

      await expect(
        updateSelfEnrollment("enroll123", "student123", { status: EnrollmentStatus.CANCELLED })
      ).rejects.toThrow(AppError);
    });
  });
});
