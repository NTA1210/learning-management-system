import {
  submitAssignment,
  resubmitAssignment,
  getSubmissionStatus,
  listSubmissionsByAssignment,
  gradeSubmission,
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

jest.mock("@/models/assignment.model");
jest.mock("@/models/submission.model");
jest.mock("@/models");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile");
jest.mock("@/utils/filePrefix");

const mockedAssignmentModel = AssignmentModel as jest.Mocked<typeof AssignmentModel>;
const mockedSubmissionModel = SubmissionModel as jest.Mocked<typeof SubmissionModel>;
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
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

describe("Submission Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitAssignment", () => {
    it("throw BAD_REQUEST if student not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null as any);

      await expect(
        submitAssignment({
          studentId: "s1",
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(null, BAD_REQUEST, "Missing user ID");
    });

    it("throw NOT_FOUND if file missing", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce({ role: Role.STUDENT } as any);

      await expect(
        submitAssignment({
          studentId: "s1",
          assignmentId: "a1",
          file: undefined as any,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(undefined, NOT_FOUND, "File is required");
    });

    it("throw NOT_FOUND if assignment not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce({ role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(null as any);

      await expect(
        submitAssignment({
          studentId: "s1",
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

      mockedUserModel.findOne.mockResolvedValueOnce({ _id: "s1", role: Role.STUDENT } as any);
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

      const result = await submitAssignment({
        studentId: "s1",
        assignmentId: "a1",
        file: {} as Express.Multer.File,
      });

      expect(mockedPrefixSubmission).toHaveBeenCalledWith("c1", "a1", "s1");
      expect(mockedUploadFile).toHaveBeenCalled();
      expect(mockedSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: "a1",
          studentId: "s1",
          status: SubmissionStatus.SUBMITTED,
        })
      );
      expect(result).toEqual({ id: "sub1" });
    });
  });

  describe("resubmitAssignment", () => {
    it("throw NOT_FOUND if file missing", async () => {
      await expect(
        resubmitAssignment({
          studentId: "s1",
          assignmentId: "a1",
          file: undefined as any,
        })
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(undefined, NOT_FOUND, "File is required");
    });

    it("throw NOT_FOUND if assignment not found", async () => {
      mockedAssignmentModel.findById.mockResolvedValueOnce(null as any);

      await expect(
        resubmitAssignment({
          studentId: "s1",
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

      await expect(
        resubmitAssignment({
          studentId: "s1",
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

      const result = await resubmitAssignment({
        studentId: "s1",
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
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: "s1", role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({ _id: "a1" } as any);
      mockedSubmissionModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce(null),
        }),
      } as any);

      const result = await getSubmissionStatus("s1", "a1");

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
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: "s1", role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({ _id: "a1" } as any);
      mockedSubmissionModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          populate: jest.fn().mockResolvedValueOnce(submission),
        }),
      } as any);

      const result = await getSubmissionStatus("s1", "a1");

      expect(result.status).toBe(SubmissionStatus.SUBMITTED);
      expect(result.grade).toBe(9);
    });
  });

  describe("listSubmissionsByAssignment", () => {
    it("return sorted list", async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce([{ id: "s1" }]),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(mockFind as any);

      const result = await listSubmissionsByAssignment("a1");

      expect(mockedSubmissionModel.find).toHaveBeenCalledWith({ assignmentId: "a1" });
      expect(mockFind.populate).toHaveBeenCalledWith("studentId", "fullname email");
      expect(mockFind.sort).toHaveBeenCalledWith({ submittedAt: -1 });
      expect(result).toEqual([{ id: "s1" }]);
    });
  });

  describe("gradeSubmission", () => {
    it("throw BAD_REQUEST if student not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null as any);

      await expect(
        gradeSubmission("a1", "s1", "g1", 9)
      ).rejects.toThrow();

      expect(mockedAppAssert).toHaveBeenCalledWith(null, BAD_REQUEST, "Missing user ID");
    });

    it("update submission with valid grade", async () => {
      const fakeAssignment = { maxScore: 10 };
      const fakeSubmission = {
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({ id: "graded1" }),
      };
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: "s1", role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(fakeAssignment as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(fakeSubmission as any);

      const graderId = new mongoose.Types.ObjectId().toHexString();
      const result = await gradeSubmission("a1", "s1", graderId, 8, "Good job");

      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(fakeSubmission.populate).toHaveBeenCalled();
      expect(result).toEqual({ id: "graded1" });
    });
  });
});
