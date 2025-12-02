// Unit tests for courseInvite.service.ts
import {
  createCourseInvite,
  joinCourseByInvite,
  listCourseInvites,
  updateCourseInvite,
  deleteCourseInvite,
} from "@/services/courseInvite.service";
import { CourseInviteModel, CourseModel, UserModel, EnrollmentModel } from "@/models";
import { AppError } from "@/utils/AppError";
import { Role } from "@/types";
import { Types } from "mongoose";
import crypto from "crypto";

jest.mock("@/models", () => ({
  CourseInviteModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
  CourseModel: {
    findById: jest.fn(),
    find: jest.fn(),
  },
  UserModel: {
    findById: jest.fn(),
  },
  EnrollmentModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("@/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/services/helpers/courseInviteHelpers", () => ({
  sendInvitesWithBatch: jest.fn(),
}));

describe("CourseInvite Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCourseInvite", () => {
    const mockCourseId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();

    it("Should create invite successfully as admin", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [] };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };
      const mockInvite = {
        _id: new Types.ObjectId(),
        tokenHash: "hashedToken",
        courseId: mockCourseId,
        createdBy: mockUserId,
        invitedEmails: ["test@example.com"],
        maxUses: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (CourseInviteModel.create as jest.Mock).mockResolvedValue(mockInvite);

      const result = await createCourseInvite(
        {
          courseId: mockCourseId.toString(),
          expiresInDays: 7,
          maxUses: 10,
          invitedEmails: ["test@example.com"],
        },
        mockUserId
      );

      expect(result.invite).toBeDefined();
      expect(result.inviteLink).toContain("token=");
      expect(result.invitedCount).toBe(1);
    });

    it("Should create invite successfully as teacher of the course", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [mockUserId] };
      const mockUser = { _id: mockUserId, role: Role.TEACHER };
      const mockInvite = {
        _id: new Types.ObjectId(),
        courseId: mockCourseId,
        createdBy: mockUserId,
        invitedEmails: ["test@example.com"],
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (CourseInviteModel.create as jest.Mock).mockResolvedValue(mockInvite);

      const result = await createCourseInvite(
        {
          courseId: mockCourseId.toString(),
          expiresInDays: 7,
          maxUses: null,
          invitedEmails: ["test@example.com"],
        },
        mockUserId
      );

      expect(result.invite).toBeDefined();
    });

    it("Should throw NOT_FOUND when course does not exist", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        createCourseInvite(
          { courseId: mockCourseId.toString(), expiresInDays: 7, maxUses: 10, invitedEmails: ["test@example.com"] },
          mockUserId
        )
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [otherTeacherId] };
      const mockUser = { _id: mockUserId, role: Role.TEACHER };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        createCourseInvite(
          { courseId: mockCourseId.toString(), expiresInDays: 7, maxUses: 10, invitedEmails: ["test@example.com"] },
          mockUserId
        )
      ).rejects.toThrow(AppError);
    });

    it("Should deduplicate emails", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [] };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };
      const mockInvite = {
        _id: new Types.ObjectId(),
        courseId: mockCourseId,
        invitedEmails: ["test@example.com"],
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (CourseInviteModel.create as jest.Mock).mockResolvedValue(mockInvite);

      const result = await createCourseInvite(
        {
          courseId: mockCourseId.toString(),
          expiresInDays: 7,
          maxUses: 10,
          invitedEmails: ["test@example.com", "TEST@EXAMPLE.COM", "test@example.com"],
        },
        mockUserId
      );

      expect(result.invitedCount).toBe(1);
    });
  });

  describe("joinCourseByInvite", () => {
    const mockUserId = new Types.ObjectId();
    const mockCourseId = new Types.ObjectId();
    const mockCreatedBy = new Types.ObjectId();

    it("Should join course successfully", async () => {
      const token = "validToken";
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const mockInvite = {
        _id: new Types.ObjectId(),
        tokenHash,
        courseId: { _id: mockCourseId, title: "Test Course" },
        createdBy: mockCreatedBy,
        invitedEmails: ["student@example.com"],
        maxUses: 10,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: mockUserId, email: "student@example.com", username: "student1", role: Role.STUDENT };
      const mockEnrollment = { _id: new Types.ObjectId(), courseId: mockCourseId, studentId: mockUserId };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);
      (EnrollmentModel.create as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await joinCourseByInvite(token, mockUserId);

      expect(result.enrollment).toBeDefined();
      expect(result.alreadyEnrolled).toBe(false);
      expect(mockInvite.save).toHaveBeenCalled();
    });

    it("Should return already enrolled message if student is already enrolled", async () => {
      const token = "validToken";
      const mockInvite = {
        _id: new Types.ObjectId(),
        courseId: { _id: mockCourseId, title: "Test Course" },
        invitedEmails: ["student@example.com"],
        maxUses: 10,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        deletedAt: null,
      };
      const mockUser = { _id: mockUserId, email: "student@example.com", role: Role.STUDENT };
      const existingEnrollment = { _id: new Types.ObjectId(), courseId: mockCourseId, studentId: mockUserId };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(existingEnrollment);

      const result = await joinCourseByInvite(token, mockUserId);

      expect(result.alreadyEnrolled).toBe(true);
    });

    it("Should throw NOT_FOUND when invite does not exist", async () => {
      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(joinCourseByInvite("invalidToken", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when invite is deleted", async () => {
      const mockInvite = {
        deletedAt: new Date(),
        isActive: true,
      };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when invite is inactive", async () => {
      const mockInvite = {
        deletedAt: null,
        isActive: false,
      };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when invite is expired", async () => {
      const mockInvite = {
        deletedAt: null,
        isActive: true,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when max uses reached", async () => {
      const mockInvite = {
        deletedAt: null,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
        maxUses: 5,
        usedCount: 5,
      };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when email not in invited list", async () => {
      const mockInvite = {
        deletedAt: null,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
        maxUses: 10,
        usedCount: 0,
        invitedEmails: ["other@example.com"],
      };
      const mockUser = { _id: mockUserId, email: "student@example.com", role: Role.STUDENT };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when user is not a student", async () => {
      const mockInvite = {
        deletedAt: null,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000),
        maxUses: 10,
        usedCount: 0,
        invitedEmails: ["teacher@example.com"],
      };
      const mockUser = { _id: mockUserId, email: "teacher@example.com", role: Role.TEACHER };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(joinCourseByInvite("token", mockUserId)).rejects.toThrow(AppError);
    });

    it("Should join course successfully when maxUses is null (unlimited)", async () => {
      const token = "validToken";
      const mockInvite = {
        _id: new Types.ObjectId(),
        courseId: { _id: mockCourseId, title: "Test Course" },
        createdBy: mockCreatedBy,
        invitedEmails: ["student@example.com"],
        maxUses: null, // Unlimited
        usedCount: 100, // Many uses but no limit
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
        deletedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: mockUserId, email: "student@example.com", username: "student1", role: Role.STUDENT };
      const mockEnrollment = { _id: new Types.ObjectId(), courseId: mockCourseId, studentId: mockUserId };

      (CourseInviteModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue(null);
      (EnrollmentModel.create as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await joinCourseByInvite(token, mockUserId);

      expect(result.enrollment).toBeDefined();
      expect(result.alreadyEnrolled).toBe(false);
    });
  });

  describe("listCourseInvites", () => {
    const mockViewerId = new Types.ObjectId();

    it("Should return paginated invites for admin", async () => {
      const mockInvites = [
        { _id: new Types.ObjectId(), courseId: { title: "Course 1" }, invitedEmails: ["a@test.com"], createdBy: {} },
      ];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };

      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await listCourseInvites({ page: 1, limit: 10 }, mockViewerId, Role.ADMIN);

      expect(result.invites).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("Should filter by courseId for teacher", async () => {
      const mockCourseId = new Types.ObjectId();
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };
      const mockCourseFind = {
        select: jest.fn().mockResolvedValue([{ _id: mockCourseId }]),
      };

      (CourseModel.find as jest.Mock).mockReturnValue(mockCourseFind);
      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await listCourseInvites({ page: 1, limit: 10 }, mockViewerId, Role.TEACHER);

      expect(result.invites).toHaveLength(0);
    });

    it("Should filter by invitedEmail", async () => {
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };

      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await listCourseInvites({ page: 1, limit: 10, invitedEmail: "test@example.com" }, mockViewerId, Role.ADMIN);

      expect(CourseInviteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          invitedEmails: expect.any(Object),
        })
      );
    });

    it("Should filter by isActive", async () => {
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };

      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await listCourseInvites({ page: 1, limit: 10, isActive: true }, mockViewerId, Role.ADMIN);

      expect(CourseInviteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it("Should filter by date range (from and to)", async () => {
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };
      const fromDate = new Date("2024-01-01");
      const toDate = new Date("2024-12-31");

      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await listCourseInvites({ page: 1, limit: 10, from: fromDate, to: toDate }, mockViewerId, Role.ADMIN);

      expect(CourseInviteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: { $gte: fromDate, $lte: toDate },
        })
      );
    });

    it("Should filter by date range (to only)", async () => {
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };
      const toDate = new Date("2024-12-31");

      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await listCourseInvites({ page: 1, limit: 10, to: toDate }, mockViewerId, Role.ADMIN);

      expect(CourseInviteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: { $lte: toDate },
        })
      );
    });

    it("Should filter by specific courseId for teacher", async () => {
      const mockCourseId = new Types.ObjectId();
      const mockInvites: any[] = [];
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockInvites),
      };
      const mockCourseFind = {
        select: jest.fn().mockResolvedValue([{ _id: mockCourseId }]),
      };

      (CourseModel.find as jest.Mock).mockReturnValue(mockCourseFind);
      (CourseInviteModel.find as jest.Mock).mockReturnValue(mockFind);
      (CourseInviteModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await listCourseInvites(
        { page: 1, limit: 10, courseId: mockCourseId.toString() },
        mockViewerId,
        Role.TEACHER
      );

      expect(CourseInviteModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: mockCourseId.toString(),
        })
      );
    });
  });

  describe("updateCourseInvite", () => {
    const mockInviteId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId();
    const mockCourseId = new Types.ObjectId();

    it("Should update invite successfully as admin", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, title: "Test", teacherIds: [] },
        isActive: true,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        invitedEmails: ["test@example.com"],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue({
          _id: mockInviteId,
          courseId: mockCourseId,
          isActive: false,
          maxUses: 10,
          usedCount: 2,
          expiresAt: new Date(Date.now() + 86400000),
          invitedEmails: ["test@example.com"],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateCourseInvite(mockInviteId, { isActive: false }, mockUserId);

      expect(result).toBeDefined();
      expect(mockInvite.save).toHaveBeenCalled();
    });

    it("Should throw NOT_FOUND when invite does not exist", async () => {
      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(updateCourseInvite(mockInviteId, { isActive: false }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when updating deleted invite", async () => {
      const mockInvite = { deletedAt: new Date() };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });

      await expect(updateCourseInvite(mockInviteId, { isActive: true }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when maxUses less than usedCount", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [] },
        usedCount: 5,
        deletedAt: null,
        save: jest.fn(),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(updateCourseInvite(mockInviteId, { maxUses: 3 }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [otherTeacherId] },
        deletedAt: null,
      };
      const mockUser = { _id: mockUserId, role: Role.TEACHER };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(updateCourseInvite(mockInviteId, { isActive: false }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when enabling expired invite", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [] },
        isActive: false,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(Date.now() - 86400000), // Yesterday - expired
        deletedAt: null,
        save: jest.fn(),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(updateCourseInvite(mockInviteId, { isActive: true }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw BAD_REQUEST when enabling invite that reached max uses", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [] },
        isActive: false,
        maxUses: 5,
        usedCount: 5, // Reached max
        expiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        save: jest.fn(),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(updateCourseInvite(mockInviteId, { isActive: true }, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should update expiresInDays successfully", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, title: "Test", teacherIds: [] },
        isActive: true,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        invitedEmails: ["test@example.com"],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateCourseInvite(mockInviteId, { expiresInDays: 14 }, mockUserId);

      expect(result).toBeDefined();
      expect(mockInvite.save).toHaveBeenCalled();
    });

    it("Should update maxUses to null (unlimited) successfully", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, title: "Test", teacherIds: [] },
        isActive: true,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        invitedEmails: ["test@example.com"],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateCourseInvite(mockInviteId, { maxUses: null }, mockUserId);

      expect(result).toBeDefined();
      expect(mockInvite.maxUses).toBeNull();
      expect(mockInvite.save).toHaveBeenCalled();
    });

    it("Should enable invite with new expiresInDays even if currently expired", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, title: "Test", teacherIds: [] },
        isActive: false,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(Date.now() - 86400000), // Expired
        deletedAt: null,
        invitedEmails: ["test@example.com"],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Enable with new expiresInDays should work
      const result = await updateCourseInvite(
        mockInviteId,
        { isActive: true, expiresInDays: 7 },
        mockUserId
      );

      expect(result).toBeDefined();
      expect(mockInvite.isActive).toBe(true);
      expect(mockInvite.save).toHaveBeenCalled();
    });

    it("Should enable invite when maxUses is null (unlimited)", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, title: "Test", teacherIds: [] },
        isActive: false,
        maxUses: null, // Unlimited
        usedCount: 100,
        expiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        invitedEmails: ["test@example.com"],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateCourseInvite(mockInviteId, { isActive: true }, mockUserId);

      expect(result).toBeDefined();
      expect(mockInvite.isActive).toBe(true);
      expect(mockInvite.save).toHaveBeenCalled();
    });
  });

  describe("deleteCourseInvite", () => {
    const mockInviteId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId();
    const mockCourseId = new Types.ObjectId();

    it("Should soft delete invite successfully", async () => {
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [] },
        deletedAt: null,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await deleteCourseInvite(mockInviteId, mockUserId);

      expect(result.message).toBe("Invite deleted successfully");
      expect(mockInvite.isActive).toBe(false);
      expect(mockInvite.deletedAt).toBeDefined();
    });

    it("Should return already deleted message if invite was already deleted", async () => {
      const deletedAt = new Date();
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [] },
        deletedAt,
      };
      const mockUser = { _id: mockUserId, role: Role.ADMIN };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await deleteCourseInvite(mockInviteId, mockUserId);

      expect(result.message).toBe("Invite already deleted");
    });

    it("Should throw NOT_FOUND when invite does not exist", async () => {
      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(deleteCourseInvite(mockInviteId, mockUserId)).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockInvite = {
        _id: mockInviteId,
        courseId: { _id: mockCourseId, teacherIds: [otherTeacherId] },
        deletedAt: null,
      };
      const mockUser = { _id: mockUserId, role: Role.TEACHER };

      (CourseInviteModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite),
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(deleteCourseInvite(mockInviteId, mockUserId)).rejects.toThrow(AppError);
    });
  });
});
