
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
  import { NOT_FOUND, BAD_REQUEST, CONFLICT } from "@/constants/http";
  import { EnrollmentStatus } from "@/types/enrollment.type";
  
  // Mock all models
  jest.mock("@/models/enrollment.model");
  jest.mock("@/models/course.model");
  jest.mock("@/models/user.model");
  
  describe("Enrollment Service Unit Tests", () => {
    // Clear all mocks before each test
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    // -------------------
    // getEnrollmentById
    // -------------------
    describe("getEnrollmentById", () => {
      const mockEnrollmentId = "507f1f77bcf86cd799439011";
  
      it("Should return enrollment when found", async () => {
        const mockEnrollment = {
          _id: mockEnrollmentId,
          studentId: "user123",
          courseId: "course123",
          status: "approved",
          populate: jest.fn().mockReturnThis(),
        };

        (EnrollmentModel.findById as jest.Mock) = jest
          .fn()
          .mockReturnValue(mockEnrollment);

        const result = await getEnrollmentById(mockEnrollmentId);
        expect(EnrollmentModel.findById).toHaveBeenCalledWith(mockEnrollmentId);
        expect(result).toEqual(mockEnrollment);
      });
  
      it("Should throw NOT_FOUND when enrollment does not exist", async () => {
        (EnrollmentModel.findById as jest.Mock) = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        });
  
        await expect(getEnrollmentById(mockEnrollmentId)).rejects.toThrow(
          AppError
        );
      });
    });
  
    // -------------------
    // getStudentEnrollments
    // -------------------
    describe("getStudentEnrollments", () => {
      const mockUserId = "user123";
  
      it("Should return paginated student enrollments", async () => {
        const mockEnrollments = [
          { _id: "enroll1", studentId: mockUserId, courseId: "course1" },
          { _id: "enroll2", studentId: mockUserId, courseId: "course2" },
        ];

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockEnrollments),
        };

        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(2);

        const result = await getStudentEnrollments({
          studentId: mockUserId,
          page: 1,
          limit: 10,
        });

        expect(result.enrollments).toEqual(mockEnrollments);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.totalPages).toBe(1);
      });
  
      it("Should filter by status", async () => {
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };

        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(0);

        await getStudentEnrollments({
          studentId: mockUserId,
          status: "approved",
        });

        expect(EnrollmentModel.find).toHaveBeenCalledWith({
          studentId: mockUserId,
          status: "approved",
        });
      });
  
      it("Should calculate pagination correctly", async () => {
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };

        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(25);

        const result = await getStudentEnrollments({
          studentId: mockUserId,
          page: 2,
          limit: 10,
        });

        expect(result.pagination.totalPages).toBe(3);
        expect(mockFind.skip).toHaveBeenCalledWith(10);
      });
    });
  
    // -------------------
    // getCourseEnrollments
    // -------------------
    describe("getCourseEnrollments", () => {
      const mockCourseId = "course123";
  
      it("Should return course enrollments when course exists", async () => {
        const mockCourse = { _id: mockCourseId, title: "Test Course" };
        const mockEnrollments = [
          { _id: "enroll1", courseId: mockCourseId },
          { _id: "enroll2", courseId: mockCourseId },
        ];
  
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
  
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockEnrollments),
        };
  
        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(2);
  
        const result = await getCourseEnrollments({
          courseId: mockCourseId,
        });
  
        expect(CourseModel.findById).toHaveBeenCalledWith(mockCourseId);
        expect(result.enrollments).toEqual(mockEnrollments);
        expect(result.pagination.total).toBe(2);
      });
  
      it("Should throw NOT_FOUND when course does not exist", async () => {
        (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);
  
        await expect(
          getCourseEnrollments({ courseId: mockCourseId })
        ).rejects.toThrow(AppError);
      });
    });
  
    // -------------------
    // getAllEnrollments
    // -------------------
    describe("getAllEnrollments", () => {
      it("Should return all enrollments with filters", async () => {
        const mockEnrollments = [
          { _id: "enroll1", status: "approved" },
          { _id: "enroll2", status: "approved" },
        ];

        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockEnrollments),
        };

        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(2);

        const result = await getAllEnrollments({
          status: "approved",
          courseId: "course123",
          studentId: "user123",
        });

        expect(EnrollmentModel.find).toHaveBeenCalledWith({
          status: "approved",
          courseId: "course123",
          studentId: "user123",
        });
        expect(result.enrollments).toEqual(mockEnrollments);
      });
  
      it("Should return all enrollments without filters", async () => {
        const mockFind = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };
  
        (EnrollmentModel.find as jest.Mock) = jest.fn().mockReturnValue(mockFind);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(0);
  
        await getAllEnrollments({});
  
        expect(EnrollmentModel.find).toHaveBeenCalledWith({});
      });
    });
  
    // -------------------
    // createEnrollment
    // -------------------
    describe("createEnrollment", () => {
      const mockStudentId = "user123";
      const mockCourseId = "course123";

      it("Should create enrollment successfully with approved status (no approval required)", async () => {
        const mockUser = { _id: mockStudentId, username: "testuser" };
        const mockCourse = {
          _id: mockCourseId,
          title: "Test Course",
          status: "ongoing",
          enrollRequiresApproval: false,
          capacity: null,
        };
        const mockEnrollment = {
          _id: "enroll123",
          studentId: mockStudentId,
          courseId: mockCourseId,
          status: "approved",
          role: "student",
          method: "self",
          populate: jest.fn().mockResolvedValue({
            _id: "enroll123",
            studentId: mockUser,
            courseId: mockCourse,
          }),
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
        (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
        (EnrollmentModel.create as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);

        const result = await createEnrollment({
          studentId: mockStudentId,
          courseId: mockCourseId,
        });

        expect(UserModel.findById).toHaveBeenCalledWith(mockStudentId);
        expect(CourseModel.findById).toHaveBeenCalledWith(mockCourseId);
        expect(EnrollmentModel.findOne).toHaveBeenCalledWith({
          studentId: mockStudentId,
          courseId: mockCourseId,
        });
        expect(EnrollmentModel.create).toHaveBeenCalledWith({
          studentId: mockStudentId,
          courseId: mockCourseId,
          status: "approved",
          role: "student",
          method: "self",
          note: undefined,
        });
      });
  
      it("Should throw NOT_FOUND when user does not exist", async () => {
        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

        await expect(
          createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })
        ).rejects.toThrow(AppError);

        expect(UserModel.findById).toHaveBeenCalledWith(mockStudentId);
      });
  
      it("Should throw NOT_FOUND when course does not exist", async () => {
        const mockUser = { _id: mockStudentId };
        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

        await expect(
          createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })
        ).rejects.toThrow(AppError);

        expect(CourseModel.findById).toHaveBeenCalledWith(mockCourseId);
      });
  
      it("Should throw BAD_REQUEST when course is not ongoing", async () => {
        const mockUser = { _id: mockStudentId };
        const mockCourse = {
          _id: mockCourseId,
          status: "draft",
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);

        await expect(
          createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })
        ).rejects.toThrow(AppError);
      });
  
      it("Should throw CONFLICT when already enrolled (approved)", async () => {
        const mockUser = { _id: mockStudentId };
        const mockCourse = {
          _id: mockCourseId,
          status: "ongoing",
        };
        const existingEnrollment = {
          _id: "existing123",
          status: "approved",
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
        (EnrollmentModel.findOne as jest.Mock) = jest
          .fn()
          .mockResolvedValue(existingEnrollment);

        await expect(
          createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })
        ).rejects.toThrow(AppError);
      });
  
      it("Should re-enroll when previous enrollment was rejected", async () => {
        const mockUser = { _id: mockStudentId };
        const mockCourse = {
          _id: mockCourseId,
          status: "ongoing",
          enrollRequiresApproval: false,
        };
        const rejectedEnrollment = {
          _id: "rejected123",
          studentId: mockStudentId,
          courseId: mockCourseId,
          status: "rejected",
          finalGrade: undefined,
          progress: { totalLessons: 0, completedLessons: 0 },
          role: "student",
          method: "self",
          updatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockResolvedValue({
            _id: "rejected123",
            status: "approved",
            studentId: mockUser,
            courseId: mockCourse,
          }),
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
        (EnrollmentModel.findOne as jest.Mock) = jest
          .fn()
          .mockResolvedValue(rejectedEnrollment);

        const result = await createEnrollment({
          studentId: mockStudentId,
          courseId: mockCourseId,
        });

        expect(rejectedEnrollment.status).toBe("approved");
        expect(rejectedEnrollment.finalGrade).toBeUndefined();
        expect(rejectedEnrollment.save).toHaveBeenCalled();
      });
  
      it("Should throw BAD_REQUEST when course is full", async () => {
        const mockUser = { _id: mockStudentId };
        const mockCourse = {
          _id: mockCourseId,
          status: "ongoing",
          capacity: 10,
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
        (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(10); // Already full

        await expect(
          createEnrollment({ studentId: mockStudentId, courseId: mockCourseId })
        ).rejects.toThrow(AppError);

        expect(EnrollmentModel.countDocuments).toHaveBeenCalledWith({
          courseId: mockCourseId,
          status: "approved",
        });
      });
  
      it("Should create enrollment when course has capacity available", async () => {
        const mockUser = { _id: mockStudentId };
        const mockCourse = {
          _id: mockCourseId,
          status: "ongoing",
          capacity: 10,
          enrollRequiresApproval: false,
        };
        const mockEnrollment = {
          _id: "enroll123",
          studentId: mockStudentId,
          courseId: mockCourseId,
          populate: jest.fn().mockResolvedValue({
            _id: "enroll123",
            studentId: mockUser,
            courseId: mockCourse,
          }),
        };

        (UserModel.findById as jest.Mock) = jest.fn().mockResolvedValue(mockUser);
        (CourseModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockCourse);
        (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
        (EnrollmentModel.countDocuments as jest.Mock) = jest
          .fn()
          .mockResolvedValue(5); // Not full
        (EnrollmentModel.create as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);

        await createEnrollment({ studentId: mockStudentId, courseId: mockCourseId });

        expect(EnrollmentModel.create).toHaveBeenCalled();
      });
    });
  
    // -------------------
    // updateEnrollment
    // -------------------
    describe("updateEnrollment", () => {
      const mockEnrollmentId = "enroll123";
  
      it("Should update enrollment successfully", async () => {
        const mockEnrollment = {
          _id: mockEnrollmentId,
          status: "approved",
        };
        const updatedEnrollment = {
          _id: mockEnrollmentId,
          status: "completed",
          finalGrade: 85,
        };

        (EnrollmentModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);

        const mockUpdate = {
          populate: jest.fn().mockReturnThis(),
        };
        // Chained populate calls
        mockUpdate.populate.mockReturnValueOnce(mockUpdate);
        mockUpdate.populate.mockResolvedValueOnce(updatedEnrollment);

        (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest
          .fn()
          .mockReturnValue(mockUpdate);

        const result = await updateEnrollment(mockEnrollmentId, {
          status: EnrollmentStatus.COMPLETED,
          finalGrade: 85,
        });

        expect(EnrollmentModel.findById).toHaveBeenCalledWith(mockEnrollmentId);
        expect(EnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockEnrollmentId,
          expect.objectContaining({
            status: EnrollmentStatus.COMPLETED,
            finalGrade: 85,
            completedAt: expect.any(Date),
          }),
          { new: true }
        );
        expect(result).toEqual(updatedEnrollment);
      });
  
      it("Should throw NOT_FOUND when enrollment does not exist", async () => {
        (EnrollmentModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

        await expect(
          updateEnrollment(mockEnrollmentId, { status: EnrollmentStatus.COMPLETED })
        ).rejects.toThrow(AppError);
      });
  
      it("Should update only provided fields", async () => {
        const mockEnrollment = { _id: mockEnrollmentId };
  
        (EnrollmentModel.findById as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);
  
        const mockUpdate = {
          populate: jest.fn().mockReturnThis(),
        };
        // Chained populate calls
        mockUpdate.populate.mockReturnValueOnce(mockUpdate);
        mockUpdate.populate.mockResolvedValueOnce(mockEnrollment);
  
        (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest
          .fn()
          .mockReturnValue(mockUpdate);
  
        await updateEnrollment(mockEnrollmentId, { finalGrade: 90 });
  
        expect(EnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockEnrollmentId,
          { finalGrade: 90 },
          { new: true }
        );
      });
    });
  
    // -------------------
    // updateSelfEnrollment
    // -------------------
    describe("updateSelfEnrollment", () => {
      const mockEnrollmentId = "enroll123";
      const mockStudentId = "user123";

      it("Should allow student to cancel their enrollment", async () => {
        const mockEnrollment = {
          _id: mockEnrollmentId,
          studentId: mockStudentId,
          status: "approved",
        };

        (EnrollmentModel.findOne as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);

        const mockUpdate = {
          populate: jest.fn().mockReturnThis(),
        };
        // Chained populate calls
        mockUpdate.populate.mockReturnValueOnce(mockUpdate);
        mockUpdate.populate.mockResolvedValueOnce({
          ...mockEnrollment,
          status: "cancelled",
        });

        (EnrollmentModel.findByIdAndUpdate as jest.Mock) = jest
          .fn()
          .mockReturnValue(mockUpdate);

        const result = await updateSelfEnrollment(mockEnrollmentId, mockStudentId, {
          status: EnrollmentStatus.CANCELLED,
        });

        expect(EnrollmentModel.findOne).toHaveBeenCalledWith({
          _id: mockEnrollmentId,
          studentId: mockStudentId,
        });
        expect(result).toBeDefined();
        expect(result!.status).toBe("cancelled");
      });
  
      it("Should throw NOT_FOUND when enrollment not found or access denied", async () => {
        (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

        await expect(
          updateSelfEnrollment(mockEnrollmentId, mockStudentId, {
            status: EnrollmentStatus.CANCELLED,
          })
        ).rejects.toThrow(AppError);
      });
  
      it("Should not allow cancelling completed enrollment", async () => {
        const mockEnrollment = {
          _id: mockEnrollmentId,
          studentId: mockStudentId,
          status: "completed",
        };

        (EnrollmentModel.findOne as jest.Mock) = jest
          .fn()
          .mockResolvedValue(mockEnrollment);

        await expect(
          updateSelfEnrollment(mockEnrollmentId, mockStudentId, {
            status: EnrollmentStatus.CANCELLED,
          })
        ).rejects.toThrow(AppError);
      });
  
      it("Should not allow student to cancel other student's enrollment", async () => {
        const otherStudentId = "otherUser123";

        (EnrollmentModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);

        await expect(
          updateSelfEnrollment(mockEnrollmentId, otherStudentId, {
            status: EnrollmentStatus.CANCELLED,
          })
        ).rejects.toThrow(AppError);

        expect(EnrollmentModel.findOne).toHaveBeenCalledWith({
          _id: mockEnrollmentId,
          studentId: otherStudentId,
        });
      });
    });
  });
  