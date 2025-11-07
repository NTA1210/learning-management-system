// Major Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/major.service", () => ({
  listMajors: jest.fn(),
  getMajorById: jest.fn(),
  getMajorBySlug: jest.fn(),
  createMajor: jest.fn(),
  updateMajorById: jest.fn(),
  updateMajorBySlug: jest.fn(),
  deleteMajorById: jest.fn(),
  deleteMajorBySlug: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/major.schemas", () => ({
  listMajorsSchema: {
    parse: jest.fn(),
  },
  majorIdSchema: {
    parse: jest.fn(),
  },
  majorSlugSchema: {
    parse: jest.fn(),
  },
  createMajorSchema: {
    parse: jest.fn(),
  },
  updateMajorSchema: {
    parse: jest.fn(),
  },
}));

// Import controller and services
import {
  listMajorsHandler,
  getMajorByIdHandler,
  getMajorBySlugHandler,
  createMajorHandler,
  updateMajorByIdHandler,
  updateMajorBySlugHandler,
  deleteMajorByIdHandler,
  deleteMajorBySlugHandler,
} from "@/controller/major.controller";
import * as majorService from "@/services/major.service";
import * as majorSchemas from "@/validators/major.schemas";

describe("📚 Major Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;
  let majorId: string;
  let major: any;

  beforeEach(() => {
    majorId = new mongoose.Types.ObjectId().toString();

    major = {
      _id: majorId,
      name: "Computer Science",
      slug: "computer-science",
      description: "Study of computation and information",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
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
  // LIST MAJORS TESTS
  // ====================================
  describe("listMajorsHandler", () => {
    it("should list majors with pagination", async () => {
      const mockMajors = [
        { _id: "1", name: "Computer Science", slug: "computer-science" },
        { _id: "2", name: "Software Engineering", slug: "software-engineering" },
      ];
      const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      mockReq.query = { page: "1", limit: "10" };
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (majorService.listMajors as jest.Mock).mockResolvedValue({
        majors: mockMajors,
        pagination: mockPagination,
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.listMajors).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        name: undefined,
        slug: undefined,
        description: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Majors retrieved successfully",
        data: mockMajors,
        pagination: mockPagination,
      });
    });

    it("should filter majors by search term", async () => {
      mockReq.query = { search: "Computer" };
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        search: "Computer",
      });
      (majorService.listMajors as jest.Mock).mockResolvedValue({
        majors: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.listMajors).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Computer" })
      );
    });

    it("should filter majors by name", async () => {
      mockReq.query = { name: "Computer Science" };
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        name: "Computer Science",
      });
      (majorService.listMajors as jest.Mock).mockResolvedValue({
        majors: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.listMajors).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Computer Science" })
      );
    });

    it("should filter majors by slug", async () => {
      mockReq.query = { slug: "computer-science" };
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        slug: "computer-science",
      });
      (majorService.listMajors as jest.Mock).mockResolvedValue({
        majors: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.listMajors).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "computer-science" })
      );
    });

    it("should sort majors by specified field", async () => {
      mockReq.query = { sortBy: "name", sortOrder: "asc" };
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      });
      (majorService.listMajors as jest.Mock).mockResolvedValue({
        majors: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.listMajors).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "name", sortOrder: "asc" })
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (majorService.listMajors as jest.Mock).mockRejectedValue(error);

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (majorSchemas.listMajorsSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await listMajorsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // GET MAJOR BY ID TESTS
  // ====================================
  describe("getMajorByIdHandler", () => {
    it("should get major by ID successfully", async () => {
      mockReq.params = { id: majorId };
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorService.getMajorById as jest.Mock).mockResolvedValue(major);

      await getMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.getMajorById).toHaveBeenCalledWith(majorId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major retrieved successfully",
        data: major,
      });
    });

    it("should handle invalid major ID", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid major ID");
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle major not found", async () => {
      mockReq.params = { id: majorId };
      const error = new Error("Major not found");
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorService.getMajorById as jest.Mock).mockRejectedValue(error);

      await getMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET MAJOR BY SLUG TESTS
  // ====================================
  describe("getMajorBySlugHandler", () => {
    it("should get major by slug successfully", async () => {
      mockReq.params = { slug: "computer-science" };
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorService.getMajorBySlug as jest.Mock).mockResolvedValue(major);

      await getMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.getMajorBySlug).toHaveBeenCalledWith("computer-science");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major retrieved successfully",
        data: major,
      });
    });

    it("should handle invalid slug", async () => {
      mockReq.params = { slug: "" };
      const error = new Error("Invalid slug");
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle major not found by slug", async () => {
      mockReq.params = { slug: "non-existent-slug" };
      const error = new Error("Major not found");
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (majorService.getMajorBySlug as jest.Mock).mockRejectedValue(error);

      await getMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // CREATE MAJOR TESTS
  // ====================================
  describe("createMajorHandler", () => {
    it("should create major successfully", async () => {
      const majorData = {
        name: "Computer Science",
        slug: "computer-science",
        description: "Study of computation",
      };
      const mockCreatedMajor = { _id: majorId, ...majorData };

      mockReq.body = majorData;
      (majorSchemas.createMajorSchema.parse as jest.Mock).mockReturnValue(majorData);
      (majorService.createMajor as jest.Mock).mockResolvedValue(mockCreatedMajor);

      await createMajorHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.createMajor).toHaveBeenCalledWith(majorData);
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Major created successfully",
        data: mockCreatedMajor,
      });
    });

    it("should create major without slug", async () => {
      const majorData = {
        name: "Computer Science",
        description: "Study of computation",
      };
      const mockCreatedMajor = { _id: majorId, ...majorData, slug: "computer-science" };

      mockReq.body = majorData;
      (majorSchemas.createMajorSchema.parse as jest.Mock).mockReturnValue(majorData);
      (majorService.createMajor as jest.Mock).mockResolvedValue(mockCreatedMajor);

      await createMajorHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.createMajor).toHaveBeenCalledWith(majorData);
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Major created successfully",
        data: mockCreatedMajor,
      });
    });

    it("should handle validation errors", async () => {
      mockReq.body = { name: "" };
      const validationError = new Error("Validation failed");
      (majorSchemas.createMajorSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createMajorHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle duplicate name error", async () => {
      const majorData = { name: "Computer Science" };
      const error = new Error("Major with this name already exists");
      mockReq.body = majorData;
      (majorSchemas.createMajorSchema.parse as jest.Mock).mockReturnValue(majorData);
      (majorService.createMajor as jest.Mock).mockRejectedValue(error);

      await createMajorHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const majorData = { name: "New Major", slug: "computer-science" };
      const error = new Error("Major with this slug already exists");
      mockReq.body = majorData;
      (majorSchemas.createMajorSchema.parse as jest.Mock).mockReturnValue(majorData);
      (majorService.createMajor as jest.Mock).mockRejectedValue(error);

      await createMajorHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // UPDATE MAJOR BY ID TESTS
  // ====================================
  describe("updateMajorByIdHandler", () => {
    it("should update major by ID successfully", async () => {
      const updateData = { description: "Updated description" };
      const mockUpdatedMajor = { ...major, description: "Updated description" };

      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockResolvedValue(mockUpdatedMajor);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.updateMajorById).toHaveBeenCalledWith(majorId, updateData);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major updated successfully",
        data: mockUpdatedMajor,
      });
    });

    it("should update major name", async () => {
      const updateData = { name: "Updated Name" };
      const mockUpdatedMajor = { ...major, name: "Updated Name" };

      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockResolvedValue(mockUpdatedMajor);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.updateMajorById).toHaveBeenCalledWith(majorId, updateData);
    });

    it("should update major slug", async () => {
      const updateData = { slug: "new-slug" };
      const mockUpdatedMajor = { ...major, slug: "new-slug" };

      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockResolvedValue(mockUpdatedMajor);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.updateMajorById).toHaveBeenCalledWith(majorId, updateData);
    });

    it("should handle major not found", async () => {
      const updateData = { name: "Updated Name" };
      const error = new Error("Major not found");
      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockRejectedValue(error);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate name error", async () => {
      const updateData = { name: "Existing Name" };
      const error = new Error("Major with this name already exists");
      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockRejectedValue(error);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const updateData = { slug: "existing-slug" };
      const error = new Error("Major with this slug already exists");
      mockReq.params = { id: majorId };
      mockReq.body = updateData;
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorById as jest.Mock).mockRejectedValue(error);

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { id: majorId };
      mockReq.body = {};
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await updateMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // UPDATE MAJOR BY SLUG TESTS
  // ====================================
  describe("updateMajorBySlugHandler", () => {
    it("should update major by slug successfully", async () => {
      const updateData = { description: "Updated description" };
      const mockUpdatedMajor = { ...major, description: "Updated description" };

      mockReq.params = { slug: "computer-science" };
      mockReq.body = updateData;
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorBySlug as jest.Mock).mockResolvedValue(mockUpdatedMajor);

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.updateMajorBySlug).toHaveBeenCalledWith("computer-science", updateData);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major updated successfully",
        data: mockUpdatedMajor,
      });
    });

    it("should update major name by slug", async () => {
      const updateData = { name: "Updated Name" };
      const mockUpdatedMajor = { ...major, name: "Updated Name" };

      mockReq.params = { slug: "computer-science" };
      mockReq.body = updateData;
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorBySlug as jest.Mock).mockResolvedValue(mockUpdatedMajor);

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.updateMajorBySlug).toHaveBeenCalledWith("computer-science", updateData);
    });

    it("should handle major not found by slug", async () => {
      const updateData = { name: "Updated Name" };
      const error = new Error("Major not found");
      mockReq.params = { slug: "non-existent-slug" };
      mockReq.body = updateData;
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorBySlug as jest.Mock).mockRejectedValue(error);

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate name error", async () => {
      const updateData = { name: "Existing Name" };
      const error = new Error("Major with this name already exists");
      mockReq.params = { slug: "computer-science" };
      mockReq.body = updateData;
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorBySlug as jest.Mock).mockRejectedValue(error);

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const updateData = { slug: "existing-slug" };
      const error = new Error("Major with this slug already exists");
      mockReq.params = { slug: "computer-science" };
      mockReq.body = updateData;
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockReturnValue(updateData);
      (majorService.updateMajorBySlug as jest.Mock).mockRejectedValue(error);

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { slug: "computer-science" };
      mockReq.body = {};
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorSchemas.updateMajorSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await updateMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // DELETE MAJOR BY ID TESTS
  // ====================================
  describe("deleteMajorByIdHandler", () => {
    it("should delete major by ID successfully", async () => {
      const mockResult = { deletedCount: 1 };

      mockReq.params = { id: majorId };
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorService.deleteMajorById as jest.Mock).mockResolvedValue(mockResult);

      await deleteMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.deleteMajorById).toHaveBeenCalledWith(majorId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major deleted successfully",
        data: mockResult,
      });
    });

    it("should handle major not found", async () => {
      const error = new Error("Major not found");
      mockReq.params = { id: majorId };
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorService.deleteMajorById as jest.Mock).mockRejectedValue(error);

      await deleteMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with specialists using major", async () => {
      const error = new Error("Cannot delete major. 5 specialists are using this major.");
      mockReq.params = { id: majorId };
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockReturnValue(majorId);
      (majorService.deleteMajorById as jest.Mock).mockRejectedValue(error);

      await deleteMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle invalid ID format", async () => {
      const error = new Error("Invalid major ID");
      mockReq.params = { id: "invalid" };
      (majorSchemas.majorIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await deleteMajorByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // DELETE MAJOR BY SLUG TESTS
  // ====================================
  describe("deleteMajorBySlugHandler", () => {
    it("should delete major by slug successfully", async () => {
      const mockResult = { deletedCount: 1 };

      mockReq.params = { slug: "computer-science" };
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorService.deleteMajorBySlug as jest.Mock).mockResolvedValue(mockResult);

      await deleteMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(majorService.deleteMajorBySlug).toHaveBeenCalledWith("computer-science");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Major deleted successfully",
        data: mockResult,
      });
    });

    it("should handle major not found by slug", async () => {
      const error = new Error("Major not found");
      mockReq.params = { slug: "non-existent-slug" };
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (majorService.deleteMajorBySlug as jest.Mock).mockRejectedValue(error);

      await deleteMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with specialists using major", async () => {
      const error = new Error("Cannot delete major. 3 specialists are using this major.");
      mockReq.params = { slug: "computer-science" };
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockReturnValue("computer-science");
      (majorService.deleteMajorBySlug as jest.Mock).mockRejectedValue(error);

      await deleteMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle invalid slug format", async () => {
      const error = new Error("Invalid slug");
      mockReq.params = { slug: "" };
      (majorSchemas.majorSlugSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await deleteMajorBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

