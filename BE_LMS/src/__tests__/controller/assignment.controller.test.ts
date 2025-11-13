// assignment.controller.test.ts
import { Request, Response } from "express";
import * as assignmentService from "@/services/assignment.service";
import * as assignmentSchemas from "@/validators/assignment.schemas";
import {
  listAssignmentsHandler,
  getAssignmentByIdHandler,
  createAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from "@/controller/assignment.controller";

// Mock service methods
jest.mock("@/services/assignment.service", () => ({
  listAssignments: jest.fn(),
  getAssignmentById: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
}));

// Mock validators
jest.mock("@/validators/assignment.schemas", () => ({
  listAssignmentsSchema: { parse: jest.fn() },
  assignmentIdSchema: { parse: jest.fn() },
  createAssignmentSchema: { parse: jest.fn() },
  updateAssignmentSchema: { parse: jest.fn() },
}));

describe("Assignment Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {} } as any;
    mockRes = { success: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // listAssignmentsHandler
  describe("listAssignmentsHandler", () => {
    it("should list assignments successfully", async () => {
      const result = {
        assignments: [{ id: "ass1" }],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      (assignmentSchemas.listAssignmentsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        courseId: "course1",
        search: "test",
        dueBefore: null,
        dueAfter: null,
        sortBy: "dueDate",
        sortOrder: "asc",
      });
      (assignmentService.listAssignments as jest.Mock).mockResolvedValue(result);

      await listAssignmentsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(assignmentService.listAssignments).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        courseId: "course1",
        search: "test",
        dueBefore: null,
        dueAfter: null,
        sortBy: "dueDate",
        sortOrder: "asc",
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: result.assignments,
        message: "Assignments retrieved successfully",
        pagination: result.pagination,
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Database failure");
      (assignmentSchemas.listAssignmentsSchema.parse as jest.Mock).mockReturnValue({});
      (assignmentService.listAssignments as jest.Mock).mockRejectedValue(error);

      await listAssignmentsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // getAssignmentByIdHandler
  describe("getAssignmentByIdHandler", () => {
    it("should get assignment by ID successfully", async () => {
      const assignment = { id: "ass1", title: "Test Assignment" };
      mockReq.params = { id: "ass1" };
      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentService.getAssignmentById as jest.Mock).mockResolvedValue(assignment);

      await getAssignmentByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(assignmentService.getAssignmentById).toHaveBeenCalledWith("ass1");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: assignment,
        message: "Assignment retrieved successfully",
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Not found");
      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentService.getAssignmentById as jest.Mock).mockRejectedValue(error);

      await getAssignmentByIdHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // createAssignmentHandler
  describe("createAssignmentHandler", () => {
    it("should create assignment successfully", async () => {
      const data = { title: "New Assignment" };
      const assignment = { id: "ass1", ...data };
      (assignmentSchemas.createAssignmentSchema.parse as jest.Mock).mockReturnValue(data);
      (assignmentService.createAssignment as jest.Mock).mockResolvedValue(assignment);

      await createAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(assignmentService.createAssignment).toHaveBeenCalledWith(data);
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        data: assignment,
        message: "Assignment created successfully",
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Create failed");
      (assignmentSchemas.createAssignmentSchema.parse as jest.Mock).mockReturnValue({});
      (assignmentService.createAssignment as jest.Mock).mockRejectedValue(error);

      await createAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // updateAssignmentHandler
  describe("updateAssignmentHandler", () => {
    it("should update assignment successfully", async () => {
      const data = { title: "Updated Assignment" };
      const updatedAssignment = { id: "ass1", ...data };
      mockReq.params = { id: "ass1" };
      mockReq.body = data;

      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentSchemas.updateAssignmentSchema.parse as jest.Mock).mockReturnValue(data);
      (assignmentService.updateAssignment as jest.Mock).mockResolvedValue(updatedAssignment);

      await updateAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(assignmentService.updateAssignment).toHaveBeenCalledWith("ass1", data);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: updatedAssignment,
        message: "Assignment updated successfully",
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Update failed");
      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentSchemas.updateAssignmentSchema.parse as jest.Mock).mockReturnValue({});
      (assignmentService.updateAssignment as jest.Mock).mockRejectedValue(error);

      await updateAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // deleteAssignmentHandler
  describe("deleteAssignmentHandler", () => {
    it("should delete assignment successfully", async () => {
      mockReq.params = { id: "ass1" };
      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentService.deleteAssignment as jest.Mock).mockResolvedValue(undefined);

      await deleteAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(assignmentService.deleteAssignment).toHaveBeenCalledWith("ass1");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: null,
        message: "Assignment deleted successfully",
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Delete failed");
      (assignmentSchemas.assignmentIdSchema.parse as jest.Mock).mockReturnValue("ass1");
      (assignmentService.deleteAssignment as jest.Mock).mockRejectedValue(error);

      await deleteAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
