// Subject Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";

// Mock MongoMemoryServer to avoid timeout in unit tests (we don't need real DB)
jest.mock("mongodb-memory-server", () => ({
  MongoMemoryServer: jest.fn().mockImplementation(() => ({
    getUri: jest.fn().mockResolvedValue("mongodb://localhost:27017/test"),
    stop: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock mongoose connection
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(actualMongoose),
    connection: {
      ...actualMongoose.connection,
      readyState: 1,
      collections: {},
      dropDatabase: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock all services before importing controller
jest.mock("@/services/subject.service", () => ({
  listSubjects: jest.fn(),
  getSubjectById: jest.fn(),
  getSubjectBySlug: jest.fn(),
  createSubject: jest.fn(),
  updateSubjectById: jest.fn(),
  updateSubjectBySlug: jest.fn(),
  deleteSubjectById: jest.fn(),
  deleteSubjectBySlug: jest.fn(),
  activateSubjectById: jest.fn(),
  deactivateSubjectById: jest.fn(),
  addPrerequisites: jest.fn(),
  removePrerequisite: jest.fn(),
  listPrerequisites: jest.fn(),
  searchSubjectsAutocomplete: jest.fn(),
  getRelatedSubjects: jest.fn(),
  getMySubjects: jest.fn(),
  deleteQuestionsBySubjectId: jest.fn(),
}));

// Mock validators
jest.mock("@/validators/subject.schemas", () => ({
  listSubjectsSchema: { parse: jest.fn() },
  subjectIdSchema: { parse: jest.fn() },
  subjectSlugSchema: { parse: jest.fn() },
  createSubjectSchema: { parse: jest.fn() },
  updateSubjectSchema: { parse: jest.fn() },
  subjectActivateSchema: { parse: jest.fn() },
  addPrerequisitesSchema: { parse: jest.fn() },
  removePrerequisiteSchema: { parse: jest.fn() },
  listPrerequisitesSchema: { parse: jest.fn() },
  autocompleteSchema: { parse: jest.fn() },
  relatedSubjectsSchema: { parse: jest.fn() },
}));

// Import controller and services
import {
  listSubjectsHandler,
  getSubjectByIdHandler,
  getSubjectBySlugHandler,
  createSubjectHandler,
  updateSubjectByIdHandler,
  updateSubjectBySlugHandler,
  deleteSubjectByIdHandler,
  deleteSubjectBySlugHandler,
  activateSubjectHandler,
  deactivateSubjectHandler,
  addPrerequisitesHandler,
  removePrerequisiteHandler,
  listPrerequisitesHandler,
  autocompleteSubjectsHandler,
  relatedSubjectsHandler,
  getMySubjectsHandler,
  deleteQuestionsBySubjectIdHandler,
} from "@/controller/subject.controller";
import * as subjectService from "@/services/subject.service";
import * as subjectSchemas from "@/validators/subject.schemas";
import { Role } from "@/types";

describe("📖 Subject Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      // add auth context
      userId: "test-user-id" as any,
      role: Role.ADMIN as any,
    };
    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("listSubjectsHandler", () => {
    it("should call listSubjects service with correct parameters", async () => {
      const mockSubjects = [{ _id: "1", name: "Subject 1" }];
      (subjectService.listSubjects as jest.Mock).mockResolvedValue({
        subjects: mockSubjects,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }
      });
      (subjectSchemas.listSubjectsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });

      await listSubjectsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.listSubjects).toHaveBeenCalled();
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subjects retrieved successfully",
        data: mockSubjects,
        pagination: expect.any(Object),
      });
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (subjectSchemas.listSubjectsSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await listSubjectsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("getSubjectByIdHandler", () => {
    it("should call getSubjectById service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      const mockSubject = { _id: subjectId, name: "Subject 1" };
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockReturnValue(subjectId);
      (subjectService.getSubjectById as jest.Mock).mockResolvedValue(mockSubject);

      await getSubjectByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.getSubjectById).toHaveBeenCalledWith(subjectId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject retrieved successfully",
        data: mockSubject,
      });
    });

    it("should handle invalid subjectId parameter", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid subject ID format");
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getSubjectByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getSubjectBySlugHandler", () => {
    it("should call getSubjectBySlug service with correct parameters", async () => {
      const slug = "test-subject";
      mockReq.params = { slug };
      const mockSubject = { _id: "1", name: "Subject 1", slug };
      (subjectSchemas.subjectSlugSchema.parse as jest.Mock).mockReturnValue(slug);
      (subjectService.getSubjectBySlug as jest.Mock).mockResolvedValue(mockSubject);

      await getSubjectBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.getSubjectBySlug).toHaveBeenCalledWith(slug);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject retrieved successfully",
        data: mockSubject,
      });
    });
  });

  describe("createSubjectHandler", () => {
    it("should call createSubject service with correct parameters", async () => {
      const subjectData = {
        name: "New Subject",
        code: "SUB001",
        credits: 3,
        description: "Test description",
      };
      mockReq.body = subjectData;
      const mockCreatedSubject = { _id: "1", ...subjectData };
      (subjectSchemas.createSubjectSchema.parse as jest.Mock).mockReturnValue(subjectData);
      (subjectService.createSubject as jest.Mock).mockResolvedValue(mockCreatedSubject);

      await createSubjectHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.createSubject).toHaveBeenCalledWith(
        expect.any(Object),
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Subject created successfully",
        data: mockCreatedSubject,
      });
    });

    it("should convert specialistIds and prerequisites to ObjectId instances", async () => {
      const subjectData = {
        name: "New Subject",
        code: "SUB001",
        credits: 3,
        specialistIds: [new mongoose.Types.ObjectId().toString()],
        prerequisites: [new mongoose.Types.ObjectId().toString()],
      };
      mockReq.body = subjectData;
      (subjectSchemas.createSubjectSchema.parse as jest.Mock).mockReturnValue(subjectData);
      (subjectService.createSubject as jest.Mock).mockResolvedValue({ _id: "1" });

      await createSubjectHandler(mockReq as Request, mockRes as Response, mockNext);

      const payload = (subjectService.createSubject as jest.Mock).mock.calls[0][0];
      expect(payload.specialistIds[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(payload.prerequisites[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it("should handle validation errors", async () => {
      mockReq.body = { name: "" }; // Invalid data
      const validationError = new Error("Validation failed");
      (subjectSchemas.createSubjectSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createSubjectHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("updateSubjectByIdHandler", () => {
    it("should call updateSubjectById service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const updateData = { name: "Updated Subject" };
      mockReq.params = { id: subjectId };
      mockReq.body = updateData;
      const mockUpdatedSubject = { _id: subjectId, ...updateData };
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockReturnValue(subjectId);
      (subjectSchemas.updateSubjectSchema.parse as jest.Mock).mockReturnValue(updateData);
      (subjectService.updateSubjectById as jest.Mock).mockResolvedValue(mockUpdatedSubject);

      await updateSubjectByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.updateSubjectById).toHaveBeenCalledWith(
        subjectId,
        expect.any(Object),
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject updated successfully",
        data: mockUpdatedSubject,
      });
    });

    it("should map ids to ObjectId instances before updating by id", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        specialistIds: [new mongoose.Types.ObjectId().toString()],
        prerequisites: [new mongoose.Types.ObjectId().toString()],
      };
      mockReq.params = { id: subjectId };
      mockReq.body = updateData;
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockReturnValue(subjectId);
      (subjectSchemas.updateSubjectSchema.parse as jest.Mock).mockReturnValue(updateData);
      (subjectService.updateSubjectById as jest.Mock).mockResolvedValue({ _id: subjectId });

      await updateSubjectByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      const payload = (subjectService.updateSubjectById as jest.Mock).mock.calls[0][1];
      expect(payload.specialistIds?.[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(payload.prerequisites?.[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe("updateSubjectBySlugHandler", () => {
    it("should call updateSubjectBySlug service with correct parameters", async () => {
      const slug = "test-subject";
      const updateData = { name: "Updated Subject" };
      mockReq.params = { slug };
      mockReq.body = updateData;
      const mockUpdatedSubject = { _id: "1", slug, ...updateData };
      (subjectSchemas.subjectSlugSchema.parse as jest.Mock).mockReturnValue(slug);
      (subjectSchemas.updateSubjectSchema.parse as jest.Mock).mockReturnValue(updateData);
      (subjectService.updateSubjectBySlug as jest.Mock).mockResolvedValue(mockUpdatedSubject);

      await updateSubjectBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.updateSubjectBySlug).toHaveBeenCalledWith(
        slug,
        expect.any(Object),
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject updated successfully",
        data: mockUpdatedSubject,
      });
    });

    it("should map ids to ObjectId instances before updating by slug", async () => {
      const slug = "test-subject";
      const updateData = {
        specialistIds: [new mongoose.Types.ObjectId().toString()],
        prerequisites: [new mongoose.Types.ObjectId().toString()],
      };
      mockReq.params = { slug };
      mockReq.body = updateData;
      (subjectSchemas.subjectSlugSchema.parse as jest.Mock).mockReturnValue(slug);
      (subjectSchemas.updateSubjectSchema.parse as jest.Mock).mockReturnValue(updateData);
      (subjectService.updateSubjectBySlug as jest.Mock).mockResolvedValue({ _id: "1" });

      await updateSubjectBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      const payload = (subjectService.updateSubjectBySlug as jest.Mock).mock.calls[0][1];
      expect(payload.specialistIds?.[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(payload.prerequisites?.[0]).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe("deleteSubjectByIdHandler", () => {
    it("should call deleteSubjectById service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      const mockDeletedResult = { deletedCount: 1 };
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockReturnValue(subjectId);
      (subjectService.deleteSubjectById as jest.Mock).mockResolvedValue(mockDeletedResult);

      await deleteSubjectByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.deleteSubjectById).toHaveBeenCalledWith(
        subjectId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject deleted successfully",
        data: mockDeletedResult,
      });
    });
  });

  describe("deleteSubjectBySlugHandler", () => {
    it("should call deleteSubjectBySlug service with correct parameters", async () => {
      const slug = "test-subject";
      mockReq.params = { slug };
      const mockDeletedResult = { deletedCount: 1 };
      (subjectSchemas.subjectSlugSchema.parse as jest.Mock).mockReturnValue(slug);
      (subjectService.deleteSubjectBySlug as jest.Mock).mockResolvedValue(mockDeletedResult);

      await deleteSubjectBySlugHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.deleteSubjectBySlug).toHaveBeenCalledWith(
        slug,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject deleted successfully",
        data: mockDeletedResult,
      });
    });
  });

  describe("activateSubjectHandler", () => {
    it("should call activateSubjectById service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      const mockSubject = { _id: subjectId, name: "Subject 1", isActive: true };
      (subjectSchemas.subjectActivateSchema.parse as jest.Mock).mockReturnValue({ id: subjectId });
      (subjectService.activateSubjectById as jest.Mock).mockResolvedValue(mockSubject);

      await activateSubjectHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.activateSubjectById).toHaveBeenCalledWith(
        subjectId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject activated successfully",
        data: mockSubject,
      });
    });
  });

  describe("deactivateSubjectHandler", () => {
    it("should call deactivateSubjectById service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      const mockSubject = { _id: subjectId, name: "Subject 1", isActive: false };
      (subjectSchemas.subjectActivateSchema.parse as jest.Mock).mockReturnValue({ id: subjectId });
      (subjectService.deactivateSubjectById as jest.Mock).mockResolvedValue(mockSubject);

      await deactivateSubjectHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.deactivateSubjectById).toHaveBeenCalledWith(
        subjectId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subject deactivated successfully",
        data: mockSubject,
      });
    });
  });

  describe("addPrerequisitesHandler", () => {
    it("should call addPrerequisites service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const prerequisiteIds = [new mongoose.Types.ObjectId().toString()];
      mockReq.params = { id: subjectId };
      mockReq.body = { prerequisiteIds };
      const mockSubject = { _id: subjectId, prerequisites: prerequisiteIds };
      (subjectSchemas.addPrerequisitesSchema.parse as jest.Mock).mockReturnValue({
        subjectId,
        prerequisiteIds,
      });
      (subjectService.addPrerequisites as jest.Mock).mockResolvedValue(mockSubject);

      await addPrerequisitesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.addPrerequisites).toHaveBeenCalledWith(
        subjectId,
        prerequisiteIds,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Prerequisites added successfully",
        data: mockSubject,
      });
    });
  });

  describe("removePrerequisiteHandler", () => {
    it("should call removePrerequisite service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const prerequisiteId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId, preId: prerequisiteId };
      const mockSubject = { _id: subjectId, prerequisites: [] };
      (subjectSchemas.removePrerequisiteSchema.parse as jest.Mock).mockReturnValue({
        subjectId,
        prerequisiteId,
      });
      (subjectService.removePrerequisite as jest.Mock).mockResolvedValue(mockSubject);

      await removePrerequisiteHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.removePrerequisite).toHaveBeenCalledWith(
        subjectId,
        prerequisiteId,
        mockReq.userId,
        mockReq.role
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Prerequisite removed successfully",
        data: mockSubject,
      });
    });
  });

  describe("listPrerequisitesHandler", () => {
    it("should call listPrerequisites service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      const mockPrerequisites = [{ _id: "1", name: "Prerequisite 1" }];
      (subjectSchemas.listPrerequisitesSchema.parse as jest.Mock).mockReturnValue({ subjectId });
      (subjectService.listPrerequisites as jest.Mock).mockResolvedValue(mockPrerequisites);

      await listPrerequisitesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.listPrerequisites).toHaveBeenCalledWith(subjectId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Prerequisites retrieved successfully",
        data: mockPrerequisites,
      });
    });
  });

  describe("autocompleteSubjectsHandler", () => {
    it("should call searchSubjectsAutocomplete service with correct parameters", async () => {
      const query = "test";
      mockReq.query = { q: query };
      const mockResults = [{ _id: "1", name: "Test Subject" }];
      (subjectSchemas.autocompleteSchema.parse as jest.Mock).mockReturnValue({ q: query, limit: 10 });
      (subjectService.searchSubjectsAutocomplete as jest.Mock).mockResolvedValue(mockResults);

      await autocompleteSubjectsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.searchSubjectsAutocomplete).toHaveBeenCalledWith(query, 10);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Subjects autocomplete successfully",
        data: mockResults,
      });
    });

    it("should fallback to empty string when q is missing", async () => {
      mockReq.query = { limit: "5" };
      (subjectSchemas.autocompleteSchema.parse as jest.Mock).mockReturnValue({ limit: 5 });
      (subjectService.searchSubjectsAutocomplete as jest.Mock).mockResolvedValue([]);

      await autocompleteSubjectsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.searchSubjectsAutocomplete).toHaveBeenCalledWith("", 5);
    });
  });

  describe("relatedSubjectsHandler", () => {
    it("should call getRelatedSubjects service with correct parameters", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { id: subjectId };
      mockReq.query = { limit: "5" };
      const mockRelated = [{ _id: "2", name: "Related Subject" }];
      (subjectSchemas.relatedSubjectsSchema.parse as jest.Mock).mockReturnValue({
        id: subjectId,
        limit: 5,
      });
      (subjectService.getRelatedSubjects as jest.Mock).mockResolvedValue(mockRelated);

      await relatedSubjectsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(subjectService.getRelatedSubjects).toHaveBeenCalledWith(subjectId, 5);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Related subjects retrieved successfully",
        data: mockRelated,
      });
    });
  });

  describe("getMySubjectsHandler", () => {
    it("should return my subjects successfully", async () => {
      const mockSubjects = [{ _id: new mongoose.Types.ObjectId(), name: "Subject 1" }];
      const mockPagination = { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false };
      
      (subjectSchemas.listSubjectsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        search: undefined,
        name: undefined,
        slug: undefined,
        code: undefined,
        specialistId: undefined,
        isActive: undefined,
        sortBy: "name",
        sortOrder: "asc",
      });
      
      (subjectService.getMySubjects as jest.Mock).mockResolvedValue({
        subjects: mockSubjects,
        pagination: mockPagination,
      });

      await getMySubjectsHandler(mockReq as Request, mockRes, mockNext);

      expect(subjectService.getMySubjects).toHaveBeenCalledWith({
        userId: (mockReq as any).userId,
        userRole: (mockReq as any).role,
        params: expect.objectContaining({
          page: 1,
          limit: 10,
        }),
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: mockSubjects,
        message: "My subjects retrieved successfully",
        pagination: mockPagination,
      });
    });
  });

  describe("deleteQuestionsBySubjectIdHandler", () => {
    it("should delete quiz questions by subject ID successfully", async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { subjectId };
      
      (subjectSchemas.subjectIdSchema.parse as jest.Mock).mockReturnValue(subjectId);
      (subjectService.deleteQuestionsBySubjectId as jest.Mock).mockResolvedValue({ deletedCount: 5 });

      await deleteQuestionsBySubjectIdHandler(mockReq as Request, mockRes, mockNext);

      expect(subjectService.deleteQuestionsBySubjectId).toHaveBeenCalledWith(subjectId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        deletedCount: 5,
        message: "Quiz questions deleted successfully",
      });
    });
  });
});


