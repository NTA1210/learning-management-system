// Specialist Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/specialist.service", () => ({
  listSpecialists: jest.fn(),
  getSpecialistById: jest.fn(),
  getSpecialistBySlug: jest.fn(),
  createSpecialist: jest.fn(),
  updateSpecialistById: jest.fn(),
  updateSpecialistBySlug: jest.fn(),
  deleteSpecialistById: jest.fn(),
  deleteSpecialistBySlug: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/specialist.schemas", () => ({
  listSpecialistsSchema: {
    parse: jest.fn(),
  },
  specialistIdSchema: {
    parse: jest.fn(),
  },
  specialistSlugSchema: {
    parse: jest.fn(),
  },
  createSpecialistSchema: {
    parse: jest.fn(),
  },
  updateSpecialistSchema: {
    parse: jest.fn(),
  },
}));

// Import controller and services
import {
  listSpecialistsHandler,
  getSpecialistByIdHandler,
  getSpecialistBySlugHandler,
  createSpecialistHandler,
  updateSpecialistByIdHandler,
  updateSpecialistBySlugHandler,
  deleteSpecialistByIdHandler,
  deleteSpecialistBySlugHandler,
} from "@/controller/specialist.controller";
import * as specialistService from "@/services/specialist.service";
import * as specialistSchemas from "@/validators/specialist.schemas";

describe("🎓 Specialist Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;
  let specialistId: string;
  let majorId: string;
  let specialist: any;

  beforeEach(() => {
    specialistId = new mongoose.Types.ObjectId().toString();
    majorId = new mongoose.Types.ObjectId().toString();

    specialist = {
      _id: specialistId,
      name: "Software Engineering",
      slug: "software-engineering",
      description: "Software development and engineering practices",
      majorId,
      isActive: true,
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
  // LIST SPECIALISTS TESTS
  // ====================================
  describe("listSpecialistsHandler", () => {
    it("should list specialists with pagination", async () => {
      const mockSpecialists = [
        { _id: "1", name: "Software Engineering", slug: "software-engineering" },
        { _id: "2", name: "Data Science", slug: "data-science" },
      ];
      const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

      mockReq.query = { page: "1", limit: "10" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: mockSpecialists,
        pagination: mockPagination,
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        name: undefined,
        slug: undefined,
        description: undefined,
        majorId: undefined,
        isActive: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialists retrieved successfully",
        data: mockSpecialists,
        pagination: mockPagination,
      });
    });

    it("should filter specialists by search term", async () => {
      mockReq.query = { search: "Software" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        search: "Software",
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Software" })
      );
    });

    it("should filter specialists by name", async () => {
      mockReq.query = { name: "Software Engineering" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        name: "Software Engineering",
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Software Engineering" })
      );
    });

    it("should filter specialists by slug", async () => {
      mockReq.query = { slug: "software-engineering" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        slug: "software-engineering",
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "software-engineering" })
      );
    });

    it("should filter specialists by majorId", async () => {
      mockReq.query = { majorId };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        majorId,
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ majorId })
      );
    });

    it("should filter specialists by isActive status", async () => {
      mockReq.query = { isActive: "true" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        isActive: true,
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it("should sort specialists by specified field", async () => {
      mockReq.query = { sortBy: "name", sortOrder: "asc" };
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
      });
      (specialistService.listSpecialists as jest.Mock).mockResolvedValue({
        specialists: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.listSpecialists).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "name", sortOrder: "asc" })
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (specialistService.listSpecialists as jest.Mock).mockRejectedValue(error);

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (specialistSchemas.listSpecialistsSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await listSpecialistsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // GET SPECIALIST BY ID TESTS
  // ====================================
  describe("getSpecialistByIdHandler", () => {
    it("should get specialist by ID successfully", async () => {
      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.getSpecialistById as jest.Mock).mockResolvedValue(specialist);

      await getSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.getSpecialistById).toHaveBeenCalledWith(specialistId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist retrieved successfully",
        data: specialist,
      });
    });

    it("should handle invalid specialist ID", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid specialist ID");
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle specialist not found", async () => {
      mockReq.params = { id: specialistId };
      const error = new Error("Specialist not found");
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.getSpecialistById as jest.Mock).mockRejectedValue(error);

      await getSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // GET SPECIALIST BY SLUG TESTS
  // ====================================
  describe("getSpecialistBySlugHandler", () => {
    it("should get specialist by slug successfully", async () => {
      mockReq.params = { slug: "software-engineering" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistService.getSpecialistBySlug as jest.Mock).mockResolvedValue(specialist);

      await getSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.getSpecialistBySlug).toHaveBeenCalledWith("software-engineering");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist retrieved successfully",
        data: specialist,
      });
    });

    it("should handle invalid slug", async () => {
      mockReq.params = { slug: "" };
      const error = new Error("Invalid slug");
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle specialist not found by slug", async () => {
      mockReq.params = { slug: "non-existent-slug" };
      const error = new Error("Specialist not found");
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (specialistService.getSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await getSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // CREATE SPECIALIST TESTS
  // ====================================
  describe("createSpecialistHandler", () => {
    it("should create specialist successfully", async () => {
      const specialistData = {
        name: "Software Engineering",
        slug: "software-engineering",
        description: "Software development practices",
        majorId,
        isActive: true,
      };
      const mockCreatedSpecialist = { _id: specialistId, ...specialistData };

      mockReq.body = specialistData;
      (specialistSchemas.createSpecialistSchema.parse as jest.Mock).mockReturnValue(specialistData);
      (specialistService.createSpecialist as jest.Mock).mockResolvedValue(mockCreatedSpecialist);

      await createSpecialistHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.createSpecialist).toHaveBeenCalledWith(
        expect.objectContaining({
          name: specialistData.name,
          slug: specialistData.slug,
          description: specialistData.description,
          majorId: specialistData.majorId,
          isActive: specialistData.isActive,
        })
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Specialist created successfully",
        data: mockCreatedSpecialist,
      });
    });

    it("should create specialist with minimal data", async () => {
      const specialistData = {
        name: "Data Science",
        slug: "data-science",
        majorId,
      };
      const mockCreatedSpecialist = { _id: specialistId, ...specialistData, isActive: true };

      mockReq.body = specialistData;
      (specialistSchemas.createSpecialistSchema.parse as jest.Mock).mockReturnValue(specialistData);
      (specialistService.createSpecialist as jest.Mock).mockResolvedValue(mockCreatedSpecialist);

      await createSpecialistHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.createSpecialist).toHaveBeenCalled();
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Specialist created successfully",
        data: mockCreatedSpecialist,
      });
    });

    it("should handle validation errors", async () => {
      mockReq.body = { name: "" };
      const validationError = new Error("Validation failed");
      (specialistSchemas.createSpecialistSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createSpecialistHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle duplicate name error", async () => {
      const specialistData = { name: "Software Engineering", slug: "software-engineering", majorId };
      const error = new Error("Specialist with this name already exists");
      mockReq.body = specialistData;
      (specialistSchemas.createSpecialistSchema.parse as jest.Mock).mockReturnValue(specialistData);
      (specialistService.createSpecialist as jest.Mock).mockRejectedValue(error);

      await createSpecialistHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const specialistData = { name: "New Specialist", slug: "software-engineering", majorId };
      const error = new Error("Specialist with this slug already exists");
      mockReq.body = specialistData;
      (specialistSchemas.createSpecialistSchema.parse as jest.Mock).mockReturnValue(specialistData);
      (specialistService.createSpecialist as jest.Mock).mockRejectedValue(error);

      await createSpecialistHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // UPDATE SPECIALIST BY ID TESTS
  // ====================================
  describe("updateSpecialistByIdHandler", () => {
    it("should update specialist by ID successfully", async () => {
      const updateData = { description: "Updated description" };
      const mockUpdatedSpecialist = { ...specialist, description: "Updated description" };

      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistById).toHaveBeenCalledWith(
        specialistId,
        expect.objectContaining({ description: "Updated description" })
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist updated successfully",
        data: mockUpdatedSpecialist,
      });
    });

    it("should update specialist name", async () => {
      const updateData = { name: "Updated Name" };
      const mockUpdatedSpecialist = { ...specialist, name: "Updated Name" };

      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistById).toHaveBeenCalledWith(specialistId, updateData);
    });

    it("should update specialist slug", async () => {
      const updateData = { slug: "new-slug" };
      const mockUpdatedSpecialist = { ...specialist, slug: "new-slug" };

      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistById).toHaveBeenCalledWith(specialistId, updateData);
    });

    it("should update specialist majorId", async () => {
      const newMajorId = new mongoose.Types.ObjectId().toString();
      const updateData = { majorId: newMajorId };
      const mockUpdatedSpecialist = { ...specialist, majorId: newMajorId };

      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistById).toHaveBeenCalledWith(
        specialistId,
        expect.objectContaining({ majorId: newMajorId })
      );
    });

    it("should update specialist isActive status", async () => {
      const updateData = { isActive: false };
      const mockUpdatedSpecialist = { ...specialist, isActive: false };

      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistById).toHaveBeenCalledWith(specialistId, updateData);
    });

    it("should handle specialist not found", async () => {
      const updateData = { name: "Updated Name" };
      const error = new Error("Specialist not found");
      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockRejectedValue(error);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate name error", async () => {
      const updateData = { name: "Existing Name" };
      const error = new Error("Specialist with this name already exists");
      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockRejectedValue(error);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const updateData = { slug: "existing-slug" };
      const error = new Error("Specialist with this slug already exists");
      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockRejectedValue(error);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle major not found error", async () => {
      const newMajorId = new mongoose.Types.ObjectId().toString();
      const updateData = { majorId: newMajorId };
      const error = new Error("Major not found");
      mockReq.params = { id: specialistId };
      mockReq.body = updateData;
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistById as jest.Mock).mockRejectedValue(error);

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { id: specialistId };
      mockReq.body = {};
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await updateSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // UPDATE SPECIALIST BY SLUG TESTS
  // ====================================
  describe("updateSpecialistBySlugHandler", () => {
    it("should update specialist by slug successfully", async () => {
      const updateData = { description: "Updated description" };
      const mockUpdatedSpecialist = { ...specialist, description: "Updated description" };

      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistBySlug).toHaveBeenCalledWith(
        "software-engineering",
        expect.objectContaining({ description: "Updated description" })
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist updated successfully",
        data: mockUpdatedSpecialist,
      });
    });

    it("should update specialist name by slug", async () => {
      const updateData = { name: "Updated Name" };
      const mockUpdatedSpecialist = { ...specialist, name: "Updated Name" };

      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistBySlug).toHaveBeenCalledWith("software-engineering", updateData);
    });

    it("should update specialist majorId by slug", async () => {
      const newMajorId = new mongoose.Types.ObjectId().toString();
      const updateData = { majorId: newMajorId };
      const mockUpdatedSpecialist = { ...specialist, majorId: newMajorId };

      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockResolvedValue(mockUpdatedSpecialist);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.updateSpecialistBySlug).toHaveBeenCalledWith(
        "software-engineering",
        expect.objectContaining({ majorId: newMajorId })
      );
    });

    it("should handle specialist not found by slug", async () => {
      const updateData = { name: "Updated Name" };
      const error = new Error("Specialist not found");
      mockReq.params = { slug: "non-existent-slug" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate name error", async () => {
      const updateData = { name: "Existing Name" };
      const error = new Error("Specialist with this name already exists");
      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle duplicate slug error", async () => {
      const updateData = { slug: "existing-slug" };
      const error = new Error("Specialist with this slug already exists");
      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle major not found error", async () => {
      const newMajorId = new mongoose.Types.ObjectId().toString();
      const updateData = { majorId: newMajorId };
      const error = new Error("Major not found");
      mockReq.params = { slug: "software-engineering" };
      mockReq.body = updateData;
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockReturnValue(updateData);
      (specialistService.updateSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { slug: "software-engineering" };
      mockReq.body = {};
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistSchemas.updateSpecialistSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await updateSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  // ====================================
  // DELETE SPECIALIST BY ID TESTS
  // ====================================
  describe("deleteSpecialistByIdHandler", () => {
    it("should delete specialist by ID successfully", async () => {
      const mockResult = { deletedCount: 1 };

      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.deleteSpecialistById as jest.Mock).mockResolvedValue(mockResult);

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.deleteSpecialistById).toHaveBeenCalledWith(specialistId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist deleted successfully",
        data: mockResult,
      });
    });

    it("should handle specialist not found", async () => {
      const error = new Error("Specialist not found");
      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.deleteSpecialistById as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with teachers using specialist", async () => {
      const error = new Error("Cannot delete specialist. 3 teachers and 0 courses are using this specialist.");
      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.deleteSpecialistById as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with courses using specialist", async () => {
      const error = new Error("Cannot delete specialist. 0 teachers and 5 courses are using this specialist.");
      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.deleteSpecialistById as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with both teachers and courses using specialist", async () => {
      const error = new Error("Cannot delete specialist. 2 teachers and 3 courses are using this specialist.");
      mockReq.params = { id: specialistId };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockReturnValue(specialistId);
      (specialistService.deleteSpecialistById as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle invalid ID format", async () => {
      const error = new Error("Invalid specialist ID");
      mockReq.params = { id: "invalid" };
      (specialistSchemas.specialistIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await deleteSpecialistByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // DELETE SPECIALIST BY SLUG TESTS
  // ====================================
  describe("deleteSpecialistBySlugHandler", () => {
    it("should delete specialist by slug successfully", async () => {
      const mockResult = { deletedCount: 1 };

      mockReq.params = { slug: "software-engineering" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistService.deleteSpecialistBySlug as jest.Mock).mockResolvedValue(mockResult);

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(specialistService.deleteSpecialistBySlug).toHaveBeenCalledWith("software-engineering");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Specialist deleted successfully",
        data: mockResult,
      });
    });

    it("should handle specialist not found by slug", async () => {
      const error = new Error("Specialist not found");
      mockReq.params = { slug: "non-existent-slug" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("non-existent-slug");
      (specialistService.deleteSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with teachers using specialist", async () => {
      const error = new Error("Cannot delete specialist. 2 teachers and 0 courses are using this specialist.");
      mockReq.params = { slug: "software-engineering" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistService.deleteSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with courses using specialist", async () => {
      const error = new Error("Cannot delete specialist. 0 teachers and 4 courses are using this specialist.");
      mockReq.params = { slug: "software-engineering" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistService.deleteSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle cannot delete with both teachers and courses using specialist", async () => {
      const error = new Error("Cannot delete specialist. 1 teachers and 1 courses are using this specialist.");
      mockReq.params = { slug: "software-engineering" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockReturnValue("software-engineering");
      (specialistService.deleteSpecialistBySlug as jest.Mock).mockRejectedValue(error);

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle invalid slug format", async () => {
      const error = new Error("Invalid slug");
      mockReq.params = { slug: "" };
      (specialistSchemas.specialistSlugSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await deleteSpecialistBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

