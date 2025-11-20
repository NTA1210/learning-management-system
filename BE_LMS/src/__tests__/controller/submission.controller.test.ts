jest.mock("@/services/submission.service", () => ({
  submitAssignment: jest.fn(),
  resubmitAssignment: jest.fn(),
  getSubmissionStatus: jest.fn(),
  listSubmissionsByAssignment: jest.fn(),
  gradeSubmission: jest.fn(),
  gradeSubmissionById: jest.fn(),
  getSubmissionStats: jest.fn(),
  getSubmissionReportByAssignment: jest.fn(),
  getSubmissionReportByCourse: jest.fn(),
  listAllGradesByStudent: jest.fn(),
}));

jest.mock("@/validators/submission.schemas", () => ({
  submissionBodySchema: { parse: jest.fn() },
  assignmentIdParamSchema: { parse: jest.fn() },
  gradeSubmissionSchema: { parse: jest.fn() },
}));

import { Request, Response } from "express";
import {
  submitAssignmentHandler,
  resubmitAssignmentHandler,
  getSubmissionStatusHandler,
  listSubmissionsByAssignmentHandler,
  gradeSubmissionHandler,
  listAllGradesByStudentHandler,
  getSubmissionStatsHandler,
  getSubmissionReportHandler,
  getCourseReportHandler,
} from "@/controller/submission.controller";
import * as submissionService from "@/services/submission.service";
import * as submissionSchemas from "@/validators/submission.schemas";

describe("Submission Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, file: null, userId: "student1" } as any;
    mockRes = { success: jest.fn().mockReturnThis() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  //submitAssignmentHandler 
  describe("submitAssignmentHandler", () => {
    it("should submit assignment successfully", async () => {
      const submissionData = { id: "sub1", status: "submitted" };
      (mockReq as any).file = { filename: "file.txt" };
      mockReq.body = { assignmentId: "ass1" };
      (submissionSchemas.submissionBodySchema.parse as jest.Mock).mockReturnValue({
        ...mockReq.body,
        file: mockReq.file,
        studentId: mockReq.userId,
      });
      (submissionService.submitAssignment as jest.Mock).mockResolvedValue(submissionData);

      await submitAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.submitAssignment).toHaveBeenCalledWith({
        ...mockReq.body,
        file: mockReq.file,
        studentId: mockReq.userId,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: submissionData,
        message: "Assignment submitted successfully",
      });
    });

    it("should handle validation errors", async () => {
      const error = new Error("Validation failed");
      (submissionSchemas.submissionBodySchema.parse as jest.Mock).mockImplementation(() => { throw error; });

      await submitAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Database failure");
      (submissionSchemas.submissionBodySchema.parse as jest.Mock).mockReturnValue({
        assignmentId: "ass1",
        file: mockReq.file,
        studentId: mockReq.userId,
      });
      (submissionService.submitAssignment as jest.Mock).mockRejectedValue(serviceError);

      await submitAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  // - resubmitAssignmentHandler 
  describe("resubmitAssignmentHandler", () => {
    it("should resubmit assignment successfully", async () => {
      const resubmissionData = { id: "sub1", status: "resubmitted" };
      (mockReq as any).file = { filename: "file2.txt" };
      mockReq.body = { assignmentId: "ass1" };
      (submissionSchemas.submissionBodySchema.parse as jest.Mock).mockReturnValue({
        ...mockReq.body,
        file: mockReq.file,
        studentId: mockReq.userId,
      });
      (submissionService.resubmitAssignment as jest.Mock).mockResolvedValue(resubmissionData);

      await resubmitAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: resubmissionData,
        message: "Assignment resubmitted successfully",
      });
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Upload failed");
      (submissionSchemas.submissionBodySchema.parse as jest.Mock).mockReturnValue({
        assignmentId: "ass1",
        file: mockReq.file,
        studentId: mockReq.userId,
      });
      (submissionService.resubmitAssignment as jest.Mock).mockRejectedValue(serviceError);

      await resubmitAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  //getSubmissionStatusHandler 
  describe("getSubmissionStatusHandler", () => {
    it("should get submission status successfully", async () => {
      const statusData = { status: "submitted" };
      mockReq.params = { assignmentId: "ass1" };
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionService.getSubmissionStatus as jest.Mock).mockResolvedValue(statusData);

      await getSubmissionStatusHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionStatus).toHaveBeenCalledWith("student1", "ass1");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: statusData,
        message: "Submission status retrieved successfully",
      });
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Status not found");
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionService.getSubmissionStatus as jest.Mock).mockRejectedValue(serviceError);

      await getSubmissionStatusHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  //listSubmissionsByAssignmentHandler 
  describe("listSubmissionsByAssignmentHandler", () => {
    it("should list submissions successfully", async () => {
      const submissions = [{ id: "sub1" }];
      mockReq.params = { assignmentId: "ass1" };
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionService.listSubmissionsByAssignment as jest.Mock).mockResolvedValue(submissions);

      await listSubmissionsByAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: submissions,
        message: "Submissions retrieved successfully",
      });
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Cannot fetch submissions");
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionService.listSubmissionsByAssignment as jest.Mock).mockRejectedValue(serviceError);

      await listSubmissionsByAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  //gradeSubmissionHandler
  describe("gradeSubmissionHandler", () => {
    it("should grade submission successfully", async () => {
      const gradeResult = { studentId: "student1", grade: 95 };
      mockReq.userId = "teacher1" as any;
      mockReq.body = { studentId: "student1", grade: 95, feedback: "Good job" };
      mockReq.params = { assignmentId: "ass1" };
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionSchemas.gradeSubmissionSchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (submissionService.gradeSubmission as jest.Mock).mockResolvedValue(gradeResult);

      await gradeSubmissionHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: gradeResult,
        message: "Submission graded successfully",
      });
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Database write failed");
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionSchemas.gradeSubmissionSchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (submissionService.gradeSubmission as jest.Mock).mockRejectedValue(serviceError);

      await gradeSubmissionHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  //  listAllGradesByStudentHandler 
  describe("listAllGradesByStudentHandler", () => {
    it("should list all grades successfully", async () => {
      const grades = [{ assignmentId: "ass1", grade: 90 }];
      mockReq.userId = "student1" as any;
      (submissionService.listAllGradesByStudent as jest.Mock).mockResolvedValue(grades);

      await listAllGradesByStudentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: grades,
        message: "All grades retrieved successfully",
      });
    });

    it("should handle service errors", async () => {
      const serviceError = new Error("Database down");
      (submissionService.listAllGradesByStudent as jest.Mock).mockRejectedValue(serviceError);

      await listAllGradesByStudentHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  // getSubmissionStatsHandler
  describe("getSubmissionStatsHandler", () => {
    it("should return submission stats successfully", async () => {
      const stats = { total: 10, submitted: 8 };
      mockReq.params = { assignmentId: "ass1" } as any;
      (submissionService.getSubmissionStats as jest.Mock).mockResolvedValue(stats);

      await getSubmissionStatsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionStats).toHaveBeenCalledWith("ass1");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: stats,
        message: "Submission statistics retrieved successfully",
      });
    });

    it("should call next on service error", async () => {
      const serviceError = new Error("Stats failed");
      mockReq.params = { assignmentId: "ass1" } as any;
      (submissionService.getSubmissionStats as jest.Mock).mockRejectedValue(serviceError);

      await getSubmissionStatsHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should call next when assignmentId is missing", async () => {
      mockReq.params = {} as any;

      await getSubmissionStatsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext.mock.calls[0] || [])[0];
      expect(err).toBeDefined();
      expect(err.message).toBe("Missing assignment ID");
    });
  });

  // getSubmissionReportHandler
  describe("getSubmissionReportHandler", () => {
    it("should return assignment report successfully", async () => {
      const report = { assignmentId: "ass1", rows: [] };
      mockReq.params = { assignmentId: "ass1" } as any;
      mockReq.query = { page: 1 } as any;
      (submissionService.getSubmissionReportByAssignment as jest.Mock).mockResolvedValue(report);

      await getSubmissionReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionReportByAssignment).toHaveBeenCalledWith("ass1", { page: 1 });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: report,
        message: "Submission report retrieved successfully",
      });
    });

    it("should call next on service error", async () => {
      const serviceError = new Error("Report failed");
      mockReq.params = { assignmentId: "ass1" } as any;
      mockReq.query = { page: 1 } as any;
      (submissionService.getSubmissionReportByAssignment as jest.Mock).mockRejectedValue(serviceError);

      await getSubmissionReportHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should call next when assignmentId is missing", async () => {
      mockReq.params = {} as any;
      mockReq.query = { page: 1 } as any;

      await getSubmissionReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext.mock.calls[0] || [])[0];
      expect(err).toBeDefined();
      expect(err.message).toBe("Missing assignment ID");
    });
  });

  // getCourseReportHandler
  describe("getCourseReportHandler", () => {
    it("should return course report successfully", async () => {
      const report = { courseId: "c1", summary: {} };
      mockReq.params = { courseId: "c1" } as any;
      (submissionService.getSubmissionReportByCourse as jest.Mock).mockResolvedValue(report);

      await getCourseReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionReportByCourse).toHaveBeenCalledWith("c1");
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: report,
        message: "Course report retrieved successfully",
      });
    });

    it("should call next on service error", async () => {
      const serviceError = new Error("Course report failed");
      mockReq.params = { courseId: "c1" } as any;
      (submissionService.getSubmissionReportByCourse as jest.Mock).mockRejectedValue(serviceError);

      await getCourseReportHandler(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should call next when courseId is missing", async () => {
      mockReq.params = {} as any;

      await getCourseReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const err = (mockNext.mock.calls[0] || [])[0];
      expect(err).toBeDefined();
      expect(err.message).toBe("Missing course ID");
    });
  });
});
