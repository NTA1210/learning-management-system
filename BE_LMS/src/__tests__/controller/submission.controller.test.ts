jest.mock("@/services/submission.service", () => ({
  submitAssignment: jest.fn(),
  resubmitAssignment: jest.fn(),
  getSubmissionStatus: jest.fn(),
  getSubmissionById: jest.fn(),
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
  submissionIdParamSchema: { parse: jest.fn() },
  gradeSubmissionSchema: { parse: jest.fn() },
}));

import { Request, Response } from "express";
import {
  submitAssignmentHandler,
  resubmitAssignmentHandler,
  getSubmissionStatusHandler,
  getSubmissionByIdHandler,
  listSubmissionsByAssignmentHandler,
  gradeSubmissionHandler,
  gradeSubmissionByIdHandler,
  listAllGradesByStudentHandler,
  getSubmissionStatsHandler,
  getSubmissionReportHandler,
  getCourseReportHandler,
} from "@/controller/submission.controller";
import * as submissionService from "@/services/submission.service";
import * as submissionSchemas from "@/validators/submission.schemas";
import { Role } from "@/types";

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

  });

  // getSubmissionByIdHandler
  describe("getSubmissionByIdHandler", () => {
    it("should get submission by id successfully", async () => {
      const submission = { id: "sub1", status: "submitted" };
      mockReq.params = { submissionId: "sub1" } as any;
      (submissionSchemas.submissionIdParamSchema.parse as jest.Mock).mockReturnValue({
        submissionId: "sub1",
      });
      (submissionService.getSubmissionById as jest.Mock).mockResolvedValue(submission);

      await getSubmissionByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionById).toHaveBeenCalledWith(
        "sub1",
        "student1",
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: submission,
        message: "Submission retrieved successfully",
      });
    });
  });
  //listSubmissionsByAssignmentHandler 
  describe("listSubmissionsByAssignmentHandler", () => {
    it("should list submissions successfully", async () => {
      const submissions = [{ id: "sub1" }];
      mockReq.params = { assignmentId: "ass1" };
      mockReq.userId = "teacher1" as any;
      mockReq.role = Role.TEACHER;
      (submissionSchemas.assignmentIdParamSchema.parse as jest.Mock).mockReturnValue({ assignmentId: "ass1" });
      (submissionService.listSubmissionsByAssignment as jest.Mock).mockResolvedValue(submissions);

      await listSubmissionsByAssignmentHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.listSubmissionsByAssignment).toHaveBeenCalledWith({
        assignmentId: "ass1",
        requesterId: "teacher1",
        requesterRole: Role.TEACHER,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: submissions,
        message: "Submissions retrieved successfully",
      });
    });

    // gradeSubmissionByIdHandler
  describe("gradeSubmissionByIdHandler", () => {
    it("should grade submission by id successfully", async () => {
      const result = { id: "sub1", grade: 90 };
      mockReq.userId = "teacher1" as any;
      mockReq.params = { submissionId: "123456789012345678901234" } as any; // 24 chars
      mockReq.body = { grade: 90, feedback: "Nice" };

      (submissionService.gradeSubmissionById as jest.Mock).mockResolvedValue(result);

      await gradeSubmissionByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.gradeSubmissionById).toHaveBeenCalledWith(
        "123456789012345678901234",
        "teacher1",
        90,
        "Nice",
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: result,
        message: "Submission graded successfully",
      });
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

  });

  // getSubmissionStatsHandler
  describe("getSubmissionStatsHandler", () => {
    it("should return submission stats successfully", async () => {
      const stats = { total: 10, submitted: 8 };
      mockReq.params = { assignmentId: "ass1" } as any;
      mockReq.userId = "teacher1" as any;
      mockReq.role = Role.TEACHER;
      (submissionService.getSubmissionStats as jest.Mock).mockResolvedValue(stats);

      await getSubmissionStatsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionStats).toHaveBeenCalledWith({
        assignmentId: "ass1",
        requesterId: "teacher1",
        requesterRole: Role.TEACHER,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: stats,
        message: "Submission statistics retrieved successfully",
      });
    });

  });

  // getSubmissionReportHandler
  describe("getSubmissionReportHandler", () => {
    it("should return assignment report successfully", async () => {
      const report = { assignmentId: "ass1", rows: [] };
      mockReq.params = { assignmentId: "ass1" } as any;
      mockReq.query = { page: 1 } as any;
      mockReq.userId = "teacher1" as any;
      mockReq.role = Role.TEACHER;
      (submissionService.getSubmissionReportByAssignment as jest.Mock).mockResolvedValue(report);

      await getSubmissionReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionReportByAssignment).toHaveBeenCalledWith(
        "ass1",
        { page: 1 },
        "teacher1",
        Role.TEACHER
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: report,
        message: "Submission report retrieved successfully",
      });
    });

  });

  // getCourseReportHandler
  describe("getCourseReportHandler", () => {
    it("should return course report successfully", async () => {
      const report = { courseId: "c1", summary: {} };
      mockReq.params = { courseId: "c1" } as any;
      mockReq.userId = "teacher1" as any;
      mockReq.role = Role.TEACHER;
      (submissionService.getSubmissionReportByCourse as jest.Mock).mockResolvedValue(report);

      await getCourseReportHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(submissionService.getSubmissionReportByCourse).toHaveBeenCalledWith(
        "c1",
        "teacher1",
        Role.TEACHER
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        data: report,
        message: "Course report retrieved successfully",
      });
    });

  });
});
