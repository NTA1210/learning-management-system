import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionStatus,
  listSubmissionsByAssignment,
  gradeSubmission,
  gradeSubmissionById,
  getSubmissionStats,
  getGradeDistribution,
  getSubmissionReportByAssignment,
  getSubmissionReportByCourse,
} from "@/services/submission.service";
import AssignmentModel from "@/models/assignment.model";
import SubmissionModel from "@/models/submission.model";
import { UserModel } from "@/models";
import appAssert from "@/utils/appAssert";
import { uploadFile } from "@/utils/uploadFile";
import { prefixSubmission } from "@/utils/filePrefix";
import { NOT_FOUND, BAD_REQUEST } from "@/constants/http";
import { SubmissionStatus } from "@/types/submission.type";
import { Role } from "@/types";
import mongoose from "mongoose";
import { ensureTeacherAccessToCourse } from "@/services/helpers/courseAccessHelpers";

jest.mock("@/models/assignment.model");
jest.mock("@/models/submission.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile");
jest.mock("@/utils/filePrefix");
jest.mock("@/services/helpers/courseAccess", () => ({
  ensureTeacherAccessToCourse: jest.fn(),
}));

const mockedAssignmentModel = AssignmentModel as jest.Mocked<typeof AssignmentModel>;
const mockedSubmissionModel = SubmissionModel as jest.Mocked<typeof SubmissionModel>;
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
import EnrollmentModel from "@/models/enrollment.model";
const mockedEnrollmentModel = EnrollmentModel as jest.Mocked<typeof EnrollmentModel>;
const mockedAppAssert = appAssert as jest.MockedFunction<typeof appAssert>;
const mockedUploadFile = uploadFile as unknown as jest.MockedFunction<
  (file: Express.Multer.File, prefix: string) => Promise<{
    key: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>
>;
const mockedPrefixSubmission = prefixSubmission as jest.MockedFunction<
  (courseId: string, assignmentId: string, studentId: string) => string
>;
const mockedEnsureTeacherAccess = ensureTeacherAccessToCourse as jest.MockedFunction<
  typeof ensureTeacherAccessToCourse
>;

describe("Submission Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnsureTeacherAccess.mockResolvedValue(undefined as any);
  });

  describe("submitAssignment", () => {
    it("throw BAD_REQUEST if student not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null as any);
      // make appAssert actually throw so function exits early
      mockedAppAssert.mockImplementationOnce((cond: any, status: any, msg: string) => {
        if (!cond) throw new Error(msg);
      });

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        submitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow("Missing user ID");

      expect(mockedAppAssert).toHaveBeenCalled();
    });

    it("throw NOT_FOUND if file missing", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce({ role: Role.STUDENT } as any);

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        submitAssignment({
          studentId,
          assignmentId: "a1",
          file: undefined as any,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(undefined, NOT_FOUND, "File is required");
    });

    it("throw NOT_FOUND if assignment not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce({ role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(null as any);

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        submitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(null, NOT_FOUND, "Assignment not found");
    });

    it("create new submission successfully", async () => {
      const fakeAssignment = {
        _id: "a1",
        allowLate: true,
        dueDate: new Date(Date.now() + 86400000),
        courseId: "c1",
      };

      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId, role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(fakeAssignment as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(null as any);
      mockedPrefixSubmission.mockReturnValueOnce("prefix/key");
      mockedUploadFile.mockResolvedValueOnce({
        key: "key123",
        originalName: "file.pdf",
        mimeType: "application/pdf",
        size: 1234,
      });
      const mockSubmission = {
        populate: jest.fn().mockResolvedValue({ id: "sub1" }),
      };
      mockedSubmissionModel.create.mockResolvedValueOnce(mockSubmission as any);

      const studentIdCall = new mongoose.Types.ObjectId();
      // ensure the mocked user exists with this id
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentIdCall, role: Role.STUDENT } as any);
      const result = await submitAssignment({
        studentId: studentIdCall,
        assignmentId: "a1",
        file: {} as Express.Multer.File,
      });

      expect(mockedPrefixSubmission).toHaveBeenCalledWith("c1", "a1", studentIdCall);
      expect(mockedUploadFile).toHaveBeenCalled();
      expect(mockedSubmissionModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
          assignmentId: "a1",
          studentId: studentIdCall,
          status: SubmissionStatus.SUBMITTED,
        })
      );
      expect(result).toEqual({ id: "sub1" });
    });
  });

  describe("resubmitAssignment", () => {
    it("throw NOT_FOUND if file missing", async () => {
      const studentId = new mongoose.Types.ObjectId();
      await expect(
        resubmitAssignment({
          studentId,
          assignmentId: "a1",
          file: undefined as any,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(undefined, NOT_FOUND, "File is required");
    });

    it("throw NOT_FOUND if assignment not found", async () => {
      mockedAssignmentModel.findById.mockResolvedValueOnce(null as any);

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        resubmitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(null, NOT_FOUND, "Assignment not found");
    });

    it("throw NOT_FOUND if submission not found", async () => {
      mockedAssignmentModel.findById.mockResolvedValueOnce({
        allowLate: true,
        courseId: "c1",
      } as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(null as any);

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        resubmitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(null, NOT_FOUND, "Submission not found");
    });

    it("update submission successfully", async () => {
      const fakeAssignment = { allowLate: true, courseId: "c1" };
      const fakeSubmission = {
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({ id: "sub1" }),
      };
      mockedAssignmentModel.findById.mockResolvedValueOnce(fakeAssignment as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(fakeSubmission as any);
      mockedPrefixSubmission.mockReturnValueOnce("prefix/key");
      mockedUploadFile.mockResolvedValueOnce({
        key: "key123",
        originalName: "newfile.pdf",
        mimeType: "application/pdf",
        size: 2048,
      });

      const studentIdCall = new mongoose.Types.ObjectId();
      const result = await resubmitAssignment({
        studentId: studentIdCall,
        assignmentId: "a1",
        file: {} as Express.Multer.File,
      });

      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(fakeSubmission.populate).toHaveBeenCalledWith("assignmentId", "title dueDate");
      expect(result).toEqual({ id: "sub1" });
    });
  });

  describe("getSubmissionStatus", () => {
    it("return not_submitted if no submission found", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId, role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({ _id: "a1" } as any);
      mockedSubmissionModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce(null),
        }),
      } as any);

      const result = await getSubmissionStatus(studentId, "a1");

      expect(result.status).toBe("not_submitted");
      expect(result.message).toBe("No submission found");
    });

    it("return submission info if found", async () => {
      const submission = {
        status: SubmissionStatus.SUBMITTED,
        isLate: false,
        grade: 9,
        feedback: "Nice",
        submittedAt: new Date(),
      };
      const studentId2 = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId2, role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({ _id: "a1" } as any);
      mockedSubmissionModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce(submission),
        }),
      } as any);

      const result = await getSubmissionStatus(studentId2, "a1");

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
      expect(result.grade).toBe(9);
    });
  });

  describe("listSubmissionsByAssignment", () => {
    it("return sorted list", async () => {
      const selectMock = jest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            courseId: new mongoose.Types.ObjectId(),
          })
        );
      mockedAssignmentModel.findById.mockReturnValueOnce({ select: selectMock } as any);
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce([{ id: "s1" }]),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(mockFind as any);
      const requesterId = new mongoose.Types.ObjectId();
      const result = await listSubmissionsByAssignment({
        assignmentId: "a1",
        requesterId,
        requesterRole: Role.TEACHER,
      });

      expect(mockedSubmissionModel.find).toHaveBeenCalledWith({ assignmentId: "a1" });
      expect(mockFind.populate).toHaveBeenCalledWith("studentId", "fullname email");
      expect(mockFind.sort).toHaveBeenCalledWith({ submittedAt: -1 });
      expect(mockedEnsureTeacherAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: requesterId,
          userRole: Role.TEACHER,
        })
      );
      expect(result).toEqual([{ id: "s1" }]);
    });
  });

  describe("gradeSubmission", () => {
    it("throw BAD_REQUEST if student not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null as any);
      // Make appAssert throw so function stops early like real assert would
      mockedAppAssert.mockImplementationOnce((cond: any, status: any, msg: string) => {
        if (!cond) throw new Error(msg);
      });

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        gradeSubmission("a1", studentId, "g1" as any, 9)
      ).rejects.toThrow("Missing user ID");

      expect(mockedAppAssert).toHaveBeenCalled();
    });

    it("update submission with valid grade", async () => {
      const fakeAssignment = { maxScore: 10, courseId: new mongoose.Types.ObjectId() };
      const fakeSubmission = {
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({ id: "graded1" }),
      };
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId, role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(fakeAssignment as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(fakeSubmission as any);

      const graderId = new mongoose.Types.ObjectId();
      const result = await gradeSubmission("a1", studentId, graderId as any, 8, "Good job");

      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(fakeSubmission.populate).toHaveBeenCalled();
      expect(result).toEqual({ id: "graded1" });
    });
  });

  describe("gradeSubmissionById", () => {
    it("throws NOT_FOUND when submission missing", async () => {
      mockedSubmissionModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(null) } as any);

      await expect(gradeSubmissionById("sub1", "g1" as any, 5)).rejects.toThrow();
    });

    it("throws BAD_REQUEST when grade out of range", async () => {
      const fakeSub = { assignmentId: { maxScore: 5, courseId: new mongoose.Types.ObjectId() } };
      mockedSubmissionModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(fakeSub) } as any);

      await expect(gradeSubmissionById("sub1", "g1" as any, 10)).rejects.toThrow();
    });

    it("grades submission successfully", async () => {
      const fakeSubmission: any = {
        assignmentId: { maxScore: 10, courseId: new mongoose.Types.ObjectId() },
        gradeHistory: [],
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({ id: "gradedById" }),
      };
      mockedSubmissionModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(fakeSubmission) } as any);

      const res = await gradeSubmissionById("sub1", "g1" as any, 8, "ok");
      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(res).toEqual({ id: "gradedById" });
    });
  });

  describe("getSubmissionStats", () => {
    it("throws error when assignment not found", async () => {
      // findById().populate(...) should resolve to null to simulate missing assignment
      mockedAssignmentModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(null) } as any);
      await expect(getSubmissionStats({ assignmentId: "a1" })).rejects.toThrow("Assignment not found");
    });

    it("returns stats successfully", async () => {
      const fakeAssignment: any = { courseId: { _id: "c1", teacherIds: [] } };
      mockedAssignmentModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(fakeAssignment) } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValueOnce(5 as any);
      mockedSubmissionModel.find.mockResolvedValueOnce([
        { status: "submitted", grade: 8 },
        { status: "overdue" },
      ] as any);

      const stats = await getSubmissionStats({ assignmentId: "a1" });
      expect(stats).toHaveProperty("totalStudents", 5);
      expect(stats).toHaveProperty("submissionRate");
      expect(stats).toHaveProperty("onTimeRate");
    });
  });

  describe("getGradeDistribution", () => {
    it("returns distribution correct counts", async () => {
      mockedSubmissionModel.find.mockResolvedValueOnce([
        { grade: 1 },
        { grade: 3 },
        { grade: 9 },
      ] as any);

      const dist = await getGradeDistribution("a1");
      expect(Array.isArray(dist)).toBe(true);
      expect(dist.some((d) => d.range === "0-2")).toBe(true);
    });
  });

  describe("getSubmissionReportByAssignment", () => {
    it("returns report object", async () => {
      // getSubmissionStats -> calls AssignmentModel.findById, EnrollmentModel.countDocuments, SubmissionModel.find
      mockedAssignmentModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce({ courseId: { _id: "c1" } }) } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValueOnce(3 as any);
      mockedSubmissionModel.find
        .mockResolvedValueOnce([{ status: "submitted" }] as any) // for stats
        .mockResolvedValueOnce([{ grade: 5 }] as any) // for distribution
        .mockReturnValueOnce({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValueOnce([{ id: "d1" }]) } as any); // for details

      const teacherId = new mongoose.Types.ObjectId();
      const report = await getSubmissionReportByAssignment("a1", { page: 1 } as any, teacherId, Role.TEACHER);
      expect(report).toHaveProperty("stats");
      expect(report).toHaveProperty("distribution");
      expect(report).toHaveProperty("details");
    });
  });

  describe("getSubmissionReportByCourse", () => {
    it("returns course report for assignments", async () => {
      // AssignmentModel.find -> returns list of assignments
      mockedAssignmentModel.find.mockResolvedValueOnce([
        { _id: "a1", title: "A1" },
      ] as any);

      // getSubmissionStats - ensure findById().populate(...) resolves to an object
      mockedAssignmentModel.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: "c1" } }) } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValue(2 as any);

      mockedSubmissionModel.find
        .mockResolvedValueOnce([{ status: "submitted" }] as any)
        .mockResolvedValueOnce([{ grade: 7 }] as any);

      const teacherId = new mongoose.Types.ObjectId();
      const reports = await getSubmissionReportByCourse("c1", teacherId, Role.TEACHER);
      expect(Array.isArray(reports)).toBe(true);
      expect(reports[0]).toHaveProperty("assignment");
      expect(reports[0]).toHaveProperty("stats");
      expect(reports[0]).toHaveProperty("distribution");
    });
  });
});
