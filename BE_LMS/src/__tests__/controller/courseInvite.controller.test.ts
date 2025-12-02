// Unit tests for courseInvite.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { OK, CREATED } from "@/constants/http";
import {
  createCourseInviteHandler,
  joinCourseInviteHandler,
  listCourseInvitesHandler,
  updateCourseInviteHandler,
  deleteCourseInviteHandler,
} from "@/controller/courseInvite.controller";
import * as courseInviteService from "@/services/courseInvite.service";
import * as courseInviteSchemas from "@/validators/courseInvite.schemas";
import { Role } from "@/types/user.type";

jest.mock("@/services/courseInvite.service");
jest.mock("@/validators/courseInvite.schemas", () => ({
  createCourseInviteSchema: { parse: jest.fn() },
  joinCourseInviteSchema: { parse: jest.fn() },
  listCourseInvitesSchema: { parse: jest.fn() },
  updateCourseInviteSchema: { parse: jest.fn() },
  courseInviteIdSchema: { parse: jest.fn() },
}));

describe("CourseInvite Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  const mockUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: mockUserId,
      role: Role.ADMIN,
    } as any;
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("createCourseInviteHandler", () => {
    it("Should create course invite successfully", async () => {
      const inviteData = {
        courseId: "507f1f77bcf86cd799439012",
        invitedEmails: ["test@example.com"],
        expiresInDays: 7,
        maxUses: 10,
      };
      const mockResult = {
        invite: { _id: "invite123", ...inviteData },
        inviteLink: "http://localhost/courses/join?token=abc123",
        invitedCount: 1,
      };

      (courseInviteSchemas.createCourseInviteSchema.parse as jest.Mock).mockReturnValue(inviteData);
      (courseInviteService.createCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.body = inviteData;

      await (createCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.createCourseInvite).toHaveBeenCalledWith(inviteData, mockUserId);
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: mockResult,
        message: "Invite link created successfully",
      });
    });

    it("Should handle validation error for invalid courseId", async () => {
      const validationError = new Error("Invalid courseId format");
      (courseInviteSchemas.createCourseInviteSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { courseId: "invalid", invitedEmails: ["test@example.com"] };

      await (createCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle validation error for invalid email format", async () => {
      const validationError = new Error("Invalid email format");
      (courseInviteSchemas.createCourseInviteSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { courseId: "507f1f77bcf86cd799439012", invitedEmails: ["invalid-email"] };

      await (createCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when course not found", async () => {
      const serviceError = new Error("Course not found");
      (courseInviteSchemas.createCourseInviteSchema.parse as jest.Mock).mockReturnValue({
        courseId: "507f1f77bcf86cd799439012",
        invitedEmails: ["test@example.com"],
        expiresInDays: 7,
        maxUses: 10,
      });
      (courseInviteService.createCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { courseId: "507f1f77bcf86cd799439012", invitedEmails: ["test@example.com"] };

      await (createCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when teacher not authorized", async () => {
      const serviceError = new Error("Only course teachers or admin can create invite links");
      (courseInviteSchemas.createCourseInviteSchema.parse as jest.Mock).mockReturnValue({
        courseId: "507f1f77bcf86cd799439012",
        invitedEmails: ["test@example.com"],
        expiresInDays: 7,
        maxUses: 10,
      });
      (courseInviteService.createCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { courseId: "507f1f77bcf86cd799439012", invitedEmails: ["test@example.com"] };
      mockReq.role = Role.TEACHER;

      await (createCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("joinCourseInviteHandler", () => {
    beforeEach(() => {
      mockReq.role = Role.STUDENT;
    });

    it("Should join course by invite successfully", async () => {
      const joinData = { token: "a".repeat(64) };
      const mockResult = {
        message: 'Successfully joined the course "Test Course".',
        enrollment: { _id: "enroll123", courseId: "course123", studentId: mockUserId },
        alreadyEnrolled: false,
        invitedEmail: ["test@example.com"],
      };

      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue(joinData);
      (courseInviteService.joinCourseByInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.body = joinData;

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.joinCourseByInvite).toHaveBeenCalledWith(joinData.token, mockUserId);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult,
        message: mockResult.message,
      });
    });

    it("Should return already enrolled message", async () => {
      const joinData = { token: "a".repeat(64) };
      const mockResult = {
        message: 'You are already enrolled in the course "Test Course".',
        enrollment: { _id: "enroll123" },
        alreadyEnrolled: true,
      };

      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue(joinData);
      (courseInviteService.joinCourseByInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.body = joinData;

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult,
        message: mockResult.message,
      });
    });

    it("Should handle validation error for invalid token format", async () => {
      const validationError = new Error("Invalid invite token format");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { token: "invalid-token" };

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when invite not found", async () => {
      const serviceError = new Error("Invalid or expired invite link");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue({ token: "a".repeat(64) });
      (courseInviteService.joinCourseByInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { token: "a".repeat(64) };

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when invite is expired", async () => {
      const serviceError = new Error("This invite link has expired");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue({ token: "a".repeat(64) });
      (courseInviteService.joinCourseByInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { token: "a".repeat(64) };

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when max uses reached", async () => {
      const serviceError = new Error("This invite link has reached its maximum number of uses");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue({ token: "a".repeat(64) });
      (courseInviteService.joinCourseByInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { token: "a".repeat(64) };

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when email not in invited list", async () => {
      const serviceError = new Error("Invite was not sent to user@example.com. Please use an invited email to join.");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue({ token: "a".repeat(64) });
      (courseInviteService.joinCourseByInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { token: "a".repeat(64) };

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when user is not a student", async () => {
      const serviceError = new Error("Only students can join courses via invite links");
      (courseInviteSchemas.joinCourseInviteSchema.parse as jest.Mock).mockReturnValue({ token: "a".repeat(64) });
      (courseInviteService.joinCourseByInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { token: "a".repeat(64) };
      mockReq.role = Role.TEACHER;

      await (joinCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });


  describe("listCourseInvitesHandler", () => {
    it("Should list course invites successfully for admin", async () => {
      const queryData = { page: 1, limit: 10 };
      const mockResult = {
        invites: [
          { id: "invite1", course: { title: "Course 1" }, invitedEmail: ["a@test.com"] },
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false },
      };

      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockReturnValue(queryData);
      (courseInviteService.listCourseInvites as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { page: "1", limit: "10" };

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.listCourseInvites).toHaveBeenCalledWith(queryData, mockUserId, Role.ADMIN);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.invites,
        pagination: mockResult.pagination,
        message: "Course invites retrieved successfully",
      });
    });

    it("Should list course invites with filters", async () => {
      const queryData = { page: 1, limit: 10, courseId: "507f1f77bcf86cd799439012", isActive: true };
      const mockResult = {
        invites: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrev: false },
      };

      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockReturnValue(queryData);
      (courseInviteService.listCourseInvites as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { page: "1", limit: "10", courseId: "507f1f77bcf86cd799439012", isActive: "true" };

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.listCourseInvites).toHaveBeenCalledWith(queryData, mockUserId, Role.ADMIN);
    });

    it("Should list course invites for teacher (filtered by their courses)", async () => {
      const queryData = { page: 1, limit: 10 };
      const mockResult = {
        invites: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNext: false, hasPrev: false },
      };

      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockReturnValue(queryData);
      (courseInviteService.listCourseInvites as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { page: "1", limit: "10" };
      mockReq.role = Role.TEACHER;

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.listCourseInvites).toHaveBeenCalledWith(queryData, mockUserId, Role.TEACHER);
    });

    it("Should handle validation error for invalid page number", async () => {
      const validationError = new Error("Page must be at least 1");
      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.query = { page: "0" };

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle validation error for invalid date range", async () => {
      const validationError = new Error("From date must be less than or equal to To date");
      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.query = { from: "2024-12-31", to: "2024-01-01" };

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error", async () => {
      const serviceError = new Error("Database error");
      (courseInviteSchemas.listCourseInvitesSchema.parse as jest.Mock).mockReturnValue({ page: 1, limit: 10 });
      (courseInviteService.listCourseInvites as jest.Mock).mockRejectedValue(serviceError);

      mockReq.query = {};

      await (listCourseInvitesHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("updateCourseInviteHandler", () => {
    it("Should update course invite successfully", async () => {
      const updateData = { isActive: false };
      const mockResult = {
        id: "invite123",
        courseId: "course123",
        isActive: false,
        maxUses: 10,
        usedCount: 2,
        expiresAt: new Date(),
        invitedEmail: ["test@example.com"],
      };

      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseInviteService.updateCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "invite123" };
      mockReq.body = updateData;

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.updateCourseInvite).toHaveBeenCalledWith("invite123", updateData, mockUserId);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult,
        message: "Course invite updated successfully",
      });
    });

    it("Should update expiresInDays successfully", async () => {
      const updateData = { expiresInDays: 14 };
      const mockResult = {
        id: "invite123",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };

      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseInviteService.updateCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "invite123" };
      mockReq.body = updateData;

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.updateCourseInvite).toHaveBeenCalledWith("invite123", updateData, mockUserId);
    });

    it("Should update maxUses successfully", async () => {
      const updateData = { maxUses: 20 };
      const mockResult = { id: "invite123", maxUses: 20 };

      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue(updateData);
      (courseInviteService.updateCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "invite123" };
      mockReq.body = updateData;

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.updateCourseInvite).toHaveBeenCalledWith("invite123", updateData, mockUserId);
    });

    it("Should handle validation error for invalid invite ID", async () => {
      const validationError = new Error("Invalid invite ID format");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "invalid" };
      mockReq.body = { isActive: false };

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle validation error for invalid expiresInDays", async () => {
      const validationError = new Error("Expires cannot exceed 365 days");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "invite123" };
      mockReq.body = { expiresInDays: 500 };

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when invite not found", async () => {
      const serviceError = new Error("Course invite not found");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue({ isActive: false });
      (courseInviteService.updateCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };
      mockReq.body = { isActive: false };

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when updating deleted invite", async () => {
      const serviceError = new Error("Cannot update deleted invite. Please create a new one.");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue({ isActive: true });
      (courseInviteService.updateCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };
      mockReq.body = { isActive: true };

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when maxUses less than usedCount", async () => {
      const serviceError = new Error("maxUses cannot be less than current usedCount (5)");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue({ maxUses: 3 });
      (courseInviteService.updateCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };
      mockReq.body = { maxUses: 3 };

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when teacher not authorized", async () => {
      const serviceError = new Error("Only course teachers or admin can update invite links");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteSchemas.updateCourseInviteSchema.parse as jest.Mock).mockReturnValue({ isActive: false });
      (courseInviteService.updateCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };
      mockReq.body = { isActive: false };
      mockReq.role = Role.TEACHER;

      await (updateCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });


  describe("deleteCourseInviteHandler", () => {
    it("Should delete course invite successfully", async () => {
      const mockResult = {
        message: "Invite deleted successfully",
        deletedAt: new Date(),
      };

      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteService.deleteCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "invite123" };

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(courseInviteService.deleteCourseInvite).toHaveBeenCalledWith("invite123", mockUserId);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult,
        message: mockResult.message,
      });
    });

    it("Should return already deleted message for idempotent delete", async () => {
      const deletedAt = new Date();
      const mockResult = {
        message: "Invite already deleted",
        deletedAt,
      };

      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteService.deleteCourseInvite as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "invite123" };

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult,
        message: mockResult.message,
      });
    });

    it("Should handle validation error for invalid invite ID", async () => {
      const validationError = new Error("Invalid invite ID format");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "invalid" };

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when invite not found", async () => {
      const serviceError = new Error("Course invite not found");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteService.deleteCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when teacher not authorized", async () => {
      const serviceError = new Error("Only course teachers or admin can delete invite links");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteService.deleteCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };
      mockReq.role = Role.TEACHER;

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when user not found", async () => {
      const serviceError = new Error("User not found");
      (courseInviteSchemas.courseInviteIdSchema.parse as jest.Mock).mockReturnValue({ id: "invite123" });
      (courseInviteService.deleteCourseInvite as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "invite123" };

      await (deleteCourseInviteHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
