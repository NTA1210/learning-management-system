// Unit tests for announcement.controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { OK, CREATED } from "@/constants/http";
import {
  createAnnouncementHandler,
  getAllAnnouncementsHandler,
  getSystemAnnouncementsHandler,
  getAnnouncementsByCourseHandler,
  getAnnouncementByIdHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from "@/controller/announcement.controller";
import * as announcementService from "@/services/announcement.service";
import * as announcementSchemas from "@/validators/announcement.schemas";
import { Role } from "@/types/user.type";

jest.mock("@/services/announcement.service");
jest.mock("@/validators/announcement.schemas", () => ({
  createAnnouncementSchema: { parse: jest.fn() },
  updateAnnouncementSchema: { parse: jest.fn() },
  announcementIdSchema: { parse: jest.fn() },
  courseIdParamSchema: { parse: jest.fn() },
  getAnnouncementsQuerySchema: { parse: jest.fn() },
}));

describe("Announcement Controller Unit Tests", () => {
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

  describe("createAnnouncementHandler", () => {
    it("Should create announcement successfully", async () => {
      const announcementData = {
        title: "Test Announcement",
        content: "Test content here",
        courseId: "507f1f77bcf86cd799439012",
      };
      const mockAnnouncement = { _id: "ann123", ...announcementData };

      (announcementSchemas.createAnnouncementSchema.parse as jest.Mock).mockReturnValue(
        announcementData
      );
      (announcementService.createAnnouncement as jest.Mock).mockResolvedValue(mockAnnouncement);

      mockReq.body = announcementData;

      await (createAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.createAnnouncement).toHaveBeenCalledWith(
        announcementData,
        mockUserId,
        Role.ADMIN
      );
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: mockAnnouncement,
        message: "Announcement created successfully",
      });
    });

    it("Should handle validation error for invalid title", async () => {
      const validationError = new Error("Title must be at least 5 characters");
      (announcementSchemas.createAnnouncementSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.body = { title: "Hi", content: "Test content" };

      await (createAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when course not found", async () => {
      const serviceError = new Error("Course not found");
      (announcementSchemas.createAnnouncementSchema.parse as jest.Mock).mockReturnValue({
        title: "Test",
        content: "Test content",
        courseId: "507f1f77bcf86cd799439012",
      });
      (announcementService.createAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { title: "Test", content: "Test content", courseId: "507f1f77bcf86cd799439012" };

      await (createAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when user not authorized", async () => {
      const serviceError = new Error("Only Admin or Teacher of this course can create announcements");
      (announcementSchemas.createAnnouncementSchema.parse as jest.Mock).mockReturnValue({
        title: "Test",
        content: "Test content",
        courseId: "507f1f77bcf86cd799439012",
      });
      (announcementService.createAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.body = { title: "Test", content: "Test content", courseId: "507f1f77bcf86cd799439012" };
      mockReq.role = Role.STUDENT;

      await (createAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("getAllAnnouncementsHandler", () => {
    it("Should get all announcements successfully", async () => {
      const mockResult = {
        announcements: [{ _id: "ann1", title: "Announcement 1" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (announcementSchemas.getAnnouncementsQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (announcementService.getAllAnnouncements as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { page: "1", limit: "10" };

      await (getAllAnnouncementsHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.getAllAnnouncements).toHaveBeenCalledWith(1, 10);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.announcements,
        pagination: mockResult.pagination,
        message: "All announcements retrieved successfully",
      });
    });

    it("Should handle validation error for invalid page", async () => {
      const validationError = new Error("Page must be greater than 0");
      (announcementSchemas.getAnnouncementsQuerySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.query = { page: "0" };

      await (getAllAnnouncementsHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("getSystemAnnouncementsHandler", () => {
    it("Should get system announcements successfully", async () => {
      const mockResult = {
        announcements: [{ _id: "ann1", title: "System Announcement" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (announcementSchemas.getAnnouncementsQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (announcementService.getSystemAnnouncements as jest.Mock).mockResolvedValue(mockResult);

      mockReq.query = { page: "1", limit: "10" };

      await (getSystemAnnouncementsHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.getSystemAnnouncements).toHaveBeenCalledWith(1, 10);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.announcements,
        pagination: mockResult.pagination,
        message: "System announcements retrieved successfully",
      });
    });
  });

  describe("getAnnouncementsByCourseHandler", () => {
    it("Should get course announcements successfully", async () => {
      const mockResult = {
        announcements: [{ _id: "ann1", title: "Course Announcement" }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      (announcementSchemas.courseIdParamSchema.parse as jest.Mock).mockReturnValue(
        "507f1f77bcf86cd799439012"
      );
      (announcementSchemas.getAnnouncementsQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (announcementService.getAnnouncementsByCourse as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { courseId: "507f1f77bcf86cd799439012" };
      mockReq.query = { page: "1", limit: "10" };

      await (getAnnouncementsByCourseHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.getAnnouncementsByCourse).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439012",
        1,
        10
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockResult.announcements,
        pagination: mockResult.pagination,
        message: "Announcements retrieved successfully",
      });
    });

    it("Should handle validation error for invalid courseId", async () => {
      const validationError = new Error("Invalid course ID");
      (announcementSchemas.courseIdParamSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { courseId: "invalid" };

      await (getAnnouncementsByCourseHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when course not found", async () => {
      const serviceError = new Error("Course not found");
      (announcementSchemas.courseIdParamSchema.parse as jest.Mock).mockReturnValue(
        "507f1f77bcf86cd799439012"
      );
      (announcementSchemas.getAnnouncementsQuerySchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (announcementService.getAnnouncementsByCourse as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { courseId: "507f1f77bcf86cd799439012" };

      await (getAnnouncementsByCourseHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });


  describe("getAnnouncementByIdHandler", () => {
    it("Should get announcement by id successfully", async () => {
      const mockAnnouncement = {
        _id: "ann123",
        title: "Test Announcement",
        content: "Test content",
      };

      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementService.getAnnouncementById as jest.Mock).mockResolvedValue(mockAnnouncement);

      mockReq.params = { id: "ann123" };

      await (getAnnouncementByIdHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.getAnnouncementById).toHaveBeenCalledWith("ann123");
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockAnnouncement,
        message: "Announcement retrieved successfully",
      });
    });

    it("Should handle validation error for invalid announcement ID", async () => {
      const validationError = new Error("Announcement ID is required");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "" };

      await (getAnnouncementByIdHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when announcement not found", async () => {
      const serviceError = new Error("Announcement not found");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementService.getAnnouncementById as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "ann123" };

      await (getAnnouncementByIdHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("updateAnnouncementHandler", () => {
    it("Should update announcement successfully", async () => {
      const updateData = { title: "Updated Title", content: "Updated content" };
      const mockUpdatedAnnouncement = { _id: "ann123", ...updateData };

      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementSchemas.updateAnnouncementSchema.parse as jest.Mock).mockReturnValue(updateData);
      (announcementService.updateAnnouncement as jest.Mock).mockResolvedValue(
        mockUpdatedAnnouncement
      );

      mockReq.params = { id: "ann123" };
      mockReq.body = updateData;

      await (updateAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.updateAnnouncement).toHaveBeenCalledWith(
        "ann123",
        updateData,
        mockUserId,
        Role.ADMIN
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: mockUpdatedAnnouncement,
        message: "Announcement updated successfully",
      });
    });

    it("Should handle validation error for invalid announcement ID", async () => {
      const validationError = new Error("Announcement ID is required");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "" };
      mockReq.body = { title: "Updated Title" };

      await (updateAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle validation error for invalid update data", async () => {
      const validationError = new Error("Title must be at least 5 characters");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementSchemas.updateAnnouncementSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "ann123" };
      mockReq.body = { title: "Hi" };

      await (updateAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when announcement not found", async () => {
      const serviceError = new Error("Announcement not found");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementSchemas.updateAnnouncementSchema.parse as jest.Mock).mockReturnValue({
        title: "Updated Title",
      });
      (announcementService.updateAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "ann123" };
      mockReq.body = { title: "Updated Title" };

      await (updateAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when user not authorized", async () => {
      const serviceError = new Error("You do not have permission to update announcement");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementSchemas.updateAnnouncementSchema.parse as jest.Mock).mockReturnValue({
        title: "Updated Title",
      });
      (announcementService.updateAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "ann123" };
      mockReq.body = { title: "Updated Title" };
      mockReq.role = Role.STUDENT;

      await (updateAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("deleteAnnouncementHandler", () => {
    it("Should delete announcement successfully", async () => {
      const mockResult = { message: "Announcement deleted successfully" };

      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementService.deleteAnnouncement as jest.Mock).mockResolvedValue(mockResult);

      mockReq.params = { id: "ann123" };

      await (deleteAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(announcementService.deleteAnnouncement).toHaveBeenCalledWith(
        "ann123",
        mockUserId,
        Role.ADMIN
      );
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: mockResult.message,
      });
    });

    it("Should handle validation error for invalid announcement ID", async () => {
      const validationError = new Error("Announcement ID is required");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      mockReq.params = { id: "" };

      await (deleteAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("Should handle service error when announcement not found", async () => {
      const serviceError = new Error("Announcement not found");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementService.deleteAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "ann123" };

      await (deleteAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("Should handle service error when user not authorized", async () => {
      const serviceError = new Error("You do not have permission to delete announcement");
      (announcementSchemas.announcementIdSchema.parse as jest.Mock).mockReturnValue("ann123");
      (announcementService.deleteAnnouncement as jest.Mock).mockRejectedValue(serviceError);

      mockReq.params = { id: "ann123" };
      mockReq.role = Role.STUDENT;

      await (deleteAnnouncementHandler as any)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
