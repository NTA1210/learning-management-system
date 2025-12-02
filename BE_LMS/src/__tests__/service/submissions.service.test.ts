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
  listAllGradesByStudent,
  getSubmissionById,
} from "@/services/submission.service";
import * as submissionServiceModule from "@/services/submission.service";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  hardDeleteNotification,
  getUnreadNotificationCount,
  undoDeleteNotification,
} from "@/services/notification.service";
import AssignmentModel from "@/models/assignment.model";
import SubmissionModel from "@/models/submission.model";
import NotificationModel from "@/models/notification.model";
import CourseModel from "@/models/course.model";
import AnnouncementModel from "@/models/announcement.model";
import UserModelDoc from "@/models/user.model";
import { UserModel } from "@/models";
import appAssert from "@/utils/appAssert";
import { uploadFile } from "@/utils/uploadFile";
import { prefixSubmission } from "@/utils/filePrefix";
import { NOT_FOUND, BAD_REQUEST } from "@/constants/http";
import { SubmissionStatus } from "@/types/submission.type";
import { Role } from "@/types";
import { EnrollmentStatus } from "@/types/enrollment.type";
import mongoose, { Types } from "mongoose";
import { ensureTeacherAccessToCourse } from "@/services/helpers/courseAccessHelpers";
import * as uploadUtils from "@/utils/uploadFile";
import * as notificationServiceModule from "@/services/notification.service";

jest.mock("@/models/assignment.model");
jest.mock("@/models/submission.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/notification.model");
jest.mock("@/models/course.model");
jest.mock("@/models/announcement.model");
jest.mock("@/models");
jest.mock("@/models/user.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile");
jest.mock("@/utils/filePrefix");
jest.mock("@/services/helpers/courseAccessHelpers", () => ({
  ensureTeacherAccessToCourse: jest.fn(),
}));

const mockedAssignmentModel = AssignmentModel as jest.Mocked<typeof AssignmentModel>;
const mockedSubmissionModel = SubmissionModel as jest.Mocked<typeof SubmissionModel>;
const mockedNotificationModel = NotificationModel as jest.Mocked<typeof NotificationModel>;
const mockedCourseModel = CourseModel as jest.Mocked<typeof CourseModel>;
const mockedAnnouncementModel = AnnouncementModel as jest.Mocked<typeof AnnouncementModel>;
const mockedUserModelDoc = UserModelDoc as jest.Mocked<typeof UserModelDoc>;
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
const mockedRemoveFile = uploadUtils.removeFile as jest.MockedFunction<
  typeof uploadUtils.removeFile
>;
const mockedDeleteFilesByPrefix =
  uploadUtils.deleteFilesByPrefix as jest.MockedFunction<
    typeof uploadUtils.deleteFilesByPrefix
  >;
const mockedGetSignedUrl = uploadUtils.getSignedUrl as jest.MockedFunction<
  typeof uploadUtils.getSignedUrl
>;

describe("Submission Service Unit Tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAppAssert.mockImplementation(() => undefined as any);
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

    it("throw BAD_REQUEST if submission is late and late not allowed", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId, role: Role.STUDENT } as any);

      const pastDue = new Date(Date.now() - 60 * 60 * 1000);
      mockedAssignmentModel.findById.mockResolvedValueOnce({
        _id: "a1",
        allowLate: false,
        dueDate: pastDue,
        courseId: "c1",
      } as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce(null as any);

      // Make appAssert behave like a real assertion for this test
      mockedAppAssert.mockImplementation((cond: any, _status: any, msg: string) => {
        if (!cond) throw new Error(msg);
      });

      await expect(
        submitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow("Submission deadline has expired");
    });

    it("throws when already submitted and resubmission not allowed", async () => {
      const studentId = new mongoose.Types.ObjectId();

      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({
        _id: "a1",
        allowLate: false,
        dueDate: new Date(Date.now() + 60 * 60 * 1000),
        courseId: "c1",
      } as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce({ id: "sub" } as any);

      mockedAppAssert.mockImplementation(
        (cond: any, _status: any, msg: string) => {
          if (!cond) throw new Error(msg);
        }
      );

      await expect(
        submitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow("You already submitted and resubmission is not allowed");
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
      expect(mockedSubmissionModel.findOne).toHaveBeenCalled();
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

    it("deletes existing file by key when resubmitting", async () => {
      const studentIdCall = new mongoose.Types.ObjectId();
      const fakeAssignment = {
        _id: "a1",
        allowLate: true,
        dueDate: new Date(Date.now() + 60 * 60 * 1000),
        courseId: "c1",
      };
      const fakeSubmission: any = {
        key: "old-key",
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockResolvedValue({ id: "resub1" }),
      };

      mockedAssignmentModel.findById.mockResolvedValueOnce(
        fakeAssignment as any
      );
      mockedSubmissionModel.findOne.mockResolvedValueOnce(fakeSubmission as any);
      mockedPrefixSubmission.mockReturnValueOnce("prefix/key");
      mockedUploadFile.mockResolvedValueOnce({
        key: "new-key",
        originalName: "file.pdf",
        mimeType: "application/pdf",
        size: 100,
      });
      mockedRemoveFile.mockResolvedValueOnce(undefined as any);

      const result = await resubmitAssignment({
        studentId: studentIdCall,
        assignmentId: "a1",
        file: {} as Express.Multer.File,
      });

      expect(mockedRemoveFile).toHaveBeenCalledWith("old-key");
      expect(mockedDeleteFilesByPrefix).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "resub1" });
    });


    it("throws BAD_REQUEST when resubmission is late and not allowed", async () => {
      const studentId = new mongoose.Types.ObjectId();
      const pastDue = new Date(Date.now() - 60 * 60 * 1000);

      mockedAssignmentModel.findById.mockResolvedValueOnce({
        _id: "a1",
        allowLate: false,
        dueDate: pastDue,
        courseId: "c1",
      } as any);
      mockedSubmissionModel.findOne.mockResolvedValueOnce({} as any);

      mockedAppAssert.mockImplementation(
        (cond: any, _status: any, msg: string) => {
          if (!cond) throw new Error(msg);
        }
      );

      await expect(
        resubmitAssignment({
          studentId,
          assignmentId: "a1",
          file: {} as Express.Multer.File,
        })
      ).rejects.toThrow("Submission deadline has expired");
    });
  });

  describe("getSubmissionStatus", () => {
    it("return not_submitted if no submission found", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({ _id: studentId, role: Role.STUDENT } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce({ _id: "a1" } as any);
      const populateSecond = jest.fn().mockResolvedValueOnce(null);
      const populateFirst = jest.fn().mockReturnValueOnce({ populate: populateSecond });
      mockedSubmissionModel.findOne.mockReturnValueOnce({ populate: populateFirst } as any);

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

  describe("getSubmissionById", () => {
    it("allows student (or default role) to view own submission and returns signed URL", async () => {
      const requesterId = new mongoose.Types.ObjectId();

      const submissionDoc: any = {
        studentId: requesterId,
        key: "file-key",
        originalName: "file.pdf",
        toObject: jest.fn().mockReturnValue({ foo: "bar" }),
      };

      const secondPopulate = jest
        .fn()
        .mockResolvedValueOnce(submissionDoc as any);
      const firstPopulate = jest
        .fn()
        .mockReturnValueOnce({ populate: secondPopulate } as any);

      mockedSubmissionModel.findById.mockReturnValueOnce({
        populate: firstPopulate,
      } as any);

      mockedGetSignedUrl.mockResolvedValueOnce("signed-url");

      const result = await getSubmissionById("sub1", requesterId);

      expect(firstPopulate).toHaveBeenCalled();
      expect(secondPopulate).toHaveBeenCalled();
      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        "file-key",
        "file.pdf"
      );
      expect(result.publicURL).toBe("signed-url");
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

    it("applies date range filter when from/to are provided", async () => {
      const selectMock = jest
        .fn()
        .mockResolvedValueOnce({
          courseId: new mongoose.Types.ObjectId(),
        } as any);
      mockedAssignmentModel.findById.mockReturnValueOnce({
        select: selectMock,
      } as any);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce([]),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(mockFind as any);

      const requesterId = new mongoose.Types.ObjectId();
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");

      await listSubmissionsByAssignment({
        assignmentId: "a1",
        requesterId,
        requesterRole: Role.TEACHER,
        from,
        to,
      });

      expect(mockedSubmissionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: "a1",
          submittedAt: { $gte: from, $lte: to },
        })
      );
    });
  });

  describe("gradeSubmission", () => {
    it("throw BAD_REQUEST if student not found", async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null as any);
      // Just assert that an error is thrown when student is missing

      const studentId = new mongoose.Types.ObjectId();
      await expect(
        gradeSubmission("a1", studentId, "g1" as any, 9)
      ).rejects.toThrow();

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
      const createNotificationSpy = jest
        .spyOn(notificationServiceModule, "createNotification")
        .mockResolvedValueOnce({} as any);

      const result = await gradeSubmission(
        "a1",
        studentId,
        graderId as any,
        8,
        "Good job",
        Role.TEACHER
      );

      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(fakeSubmission.populate).toHaveBeenCalled();
      expect(result).toEqual({ id: "graded1" });
      expect(createNotificationSpy).toHaveBeenCalled();
      createNotificationSpy.mockRestore();
    });

    it("throws BAD_REQUEST when grade is out of range", async () => {
      const fakeAssignment = {
        maxScore: 5,
        courseId: new mongoose.Types.ObjectId(),
      };
      const studentId = new mongoose.Types.ObjectId();
      const graderId = new mongoose.Types.ObjectId();

      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);
      mockedAssignmentModel.findById.mockResolvedValueOnce(
        fakeAssignment as any
      );
      mockedSubmissionModel.findOne.mockResolvedValueOnce({} as any);

      mockedAppAssert.mockImplementation(
        (cond: any, _status: any, msg: string) => {
          if (!cond) throw new Error(msg);
        }
      );

      await expect(
        gradeSubmission(
          "a1",
          studentId,
          graderId as any,
          10,
          "Too high",
          Role.TEACHER
        )
      ).rejects.toThrow("Grade must be between 0 and 5");
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

      const res = await gradeSubmissionById(
        "sub1",
        "g1" as any,
        8,
        "ok",
        Role.TEACHER
      );
      expect(fakeSubmission.save).toHaveBeenCalled();
      expect(res).toEqual({ id: "gradedById" });
    });
  });

  describe("createnotification", () => {
    it("throws if recipientUser is missing", async () => {
      const senderId = new Types.ObjectId();
      await expect(
        createNotification(
          {
            title: "t",
            message: "m",
            recipientType: "user",
            recipientUser: undefined as any,
          } as any,
          senderId,
          Role.TEACHER
        )
      ).rejects.toThrow("recipientUser is required");
    });

    it("creates user notification for teacher & enrolled student in course", async () => {
      const senderId = new Types.ObjectId();
      const studentId = new Types.ObjectId();
      const courseId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: studentId,
      } as any);
      mockedCourseModel.findById.mockResolvedValueOnce({
        _id: courseId,
      } as any);

      const teacherCoursesSelectMock = jest
        .fn()
        .mockResolvedValueOnce([{ _id: courseId }] as any);
      mockedCourseModel.find.mockReturnValueOnce({
        select: teacherCoursesSelectMock,
      } as any);
      mockedEnrollmentModel.exists.mockResolvedValueOnce(true as any);

      const created = { _id: "n1" };
      mockedNotificationModel.create.mockResolvedValueOnce(created as any);

      const result = await createNotification(
        {
          title: "Hello",
          message: "Msg",
          recipientType: "user",
          recipientUser: studentId as any,
          recipientCourse: courseId as any,
        } as any,
        senderId,
        Role.TEACHER
      );

      expect(mockedNotificationModel.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it("throws when teacher is not assigned to any courses", async () => {
      const senderId = new Types.ObjectId();
      const studentId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: studentId,
      } as any);

      const teacherCoursesSelectMock = jest
        .fn()
        .mockResolvedValueOnce([] as any);
      mockedCourseModel.find.mockReturnValueOnce({
        select: teacherCoursesSelectMock,
      } as any);

      mockedAppAssert.mockImplementation(
        (cond: any, _status: any, msg: string) => {
          if (!cond) throw new Error(msg);
        }
      );

      await expect(
        createNotification(
          {
            title: "Hello",
            message: "Msg",
            recipientType: "user",
            recipientUser: studentId as any,
          } as any,
          senderId,
          Role.TEACHER
        )
      ).rejects.toThrow("You are not assigned to any courses");
    });

    it("creates system notification without permission checks", async () => {
      const senderId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({ _id: userId } as any);
      const created = { _id: "sys1" };
      mockedNotificationModel.create.mockResolvedValueOnce(created as any);

      const result = await createNotification(
        {
          title: "System",
          message: "Maintenance",
          recipientType: "system",
          recipientUser: userId as any,
        } as any,
        senderId,
        Role.ADMIN
      );

      expect(mockedNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientType: "system" })
      );
      expect(result).toBe(created);
    });

    it("creates general user notification when student is enrolled in any teacher course", async () => {
      const senderId = new Types.ObjectId();
      const studentId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: studentId,
      } as any);

      const teacherCoursesSelectMock = jest
        .fn()
        .mockResolvedValueOnce([{ _id: new Types.ObjectId() }] as any);
      mockedCourseModel.find.mockReturnValueOnce({
        select: teacherCoursesSelectMock,
      } as any);

      mockedEnrollmentModel.exists.mockResolvedValueOnce(true as any);

      const created = { _id: "gen1" };
      mockedNotificationModel.create.mockResolvedValueOnce(created as any);

      const result = await createNotification(
        {
          title: "Hi",
          message: "General",
          recipientType: "user",
          recipientUser: studentId as any,
        } as any,
        senderId,
        Role.TEACHER
      );

      expect(mockedNotificationModel.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });

    it("throws when student not enrolled in any of teacher courses", async () => {
      const senderId = new Types.ObjectId();
      const studentId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: studentId,
      } as any);

      const teacherCoursesSelectMock = jest
        .fn()
        .mockResolvedValueOnce([{ _id: new Types.ObjectId() }] as any);
      mockedCourseModel.find.mockReturnValueOnce({
        select: teacherCoursesSelectMock,
      } as any);

      mockedEnrollmentModel.exists.mockResolvedValueOnce(false as any);

      mockedAppAssert.mockImplementation(
        (cond: any, _status: any, msg: string) => {
          if (!cond) throw new Error(msg);
        }
      );

      await expect(
        createNotification(
          {
            title: "Hi",
            message: "General",
            recipientType: "user",
            recipientUser: studentId as any,
          } as any,
          senderId,
          Role.TEACHER
        )
      ).rejects.toThrow(
        "You can only message students enrolled in your courses"
      );
    });

    it("throws error for invalid recipient type", async () => {
      const senderId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: userId,
      } as any);

      await expect(
        createNotification(
          {
            title: "t",
            message: "m",
            recipientType: "unknown",
            recipientUser: userId as any,
          } as any,
          senderId,
          Role.ADMIN
        )
      ).rejects.toThrow("Invalid recipient type");
    });

    it("allows admin to send user notification without teacher course checks", async () => {
      const senderId = new Types.ObjectId();
      const studentId = new Types.ObjectId();

      mockedUserModelDoc.findById.mockResolvedValueOnce({
        _id: studentId,
      } as any);

      const created = { _id: "adminUserNotif" };
      mockedNotificationModel.create.mockResolvedValueOnce(created as any);

      const result = await createNotification(
        {
          title: "Admin msg",
          message: "Hello",
          recipientType: "user",
          recipientUser: studentId as any,
        } as any,
        senderId,
        Role.ADMIN
      );

      expect(mockedCourseModel.find).not.toHaveBeenCalled();
      expect(mockedEnrollmentModel.exists).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe("getNotifications", () => {
    it("returns merged & paginated notifications and announcements", async () => {
      const userId = new Types.ObjectId();

      // enrolled course chain: find().select().then(...)
      const enrollSelectMock = jest
        .fn()
        .mockResolvedValueOnce([{ courseId: new Types.ObjectId() }] as any);
      mockedEnrollmentModel.find.mockReturnValueOnce({
        select: enrollSelectMock,
      } as any);

      // notifications chain
      const notifDocs = [
        { _id: "n1", message: "notif", createdAt: new Date(), isRead: false },
      ];
      const notifQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(notifDocs),
      };
      mockedNotificationModel.find.mockReturnValueOnce(notifQuery as any);

      // announcements chain
      const annDocs = [
        {
          _id: "a1",
          title: "Ann",
          content: "Content",
          authorId: {},
          courseId: {},
          createdAt: new Date(),
        },
      ];
      const annQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(annDocs),
      };
      mockedAnnouncementModel.find.mockReturnValueOnce(annQuery as any);

      const result = await getNotifications(
        userId,
        { page: 1, limit: 10 } as any
      );

      expect(result.notifications.length).toBe(2);
      expect(result.pagination.total).toBe(2);
    });

    it("applies isRead and date filters", async () => {
      const userId = new Types.ObjectId();
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");

      const enrollSelectMock = jest
        .fn()
        .mockResolvedValueOnce([{ courseId: new Types.ObjectId() }] as any);
      mockedEnrollmentModel.find.mockReturnValueOnce({
        select: enrollSelectMock,
      } as any);

      const notifDocs: any[] = [];
      const notifQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(notifDocs),
      };
      mockedNotificationModel.find.mockReturnValueOnce(notifQuery as any);

      const annDocs: any[] = [];
      const annQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(annDocs),
      };
      mockedAnnouncementModel.find.mockReturnValueOnce(annQuery as any);

      const result = await getNotifications(userId, {
        page: 1,
        limit: 10,
        isRead: true,
        from,
        to,
      } as any);

      expect(result.notifications).toEqual([]);
    });

    it("handles date filters with only from or only to", async () => {
      const userId = new Types.ObjectId();
      const from = new Date("2024-01-01");

      const enrollSelectMock = jest
        .fn()
        .mockResolvedValueOnce([] as any);
      mockedEnrollmentModel.find.mockReturnValueOnce({
        select: enrollSelectMock,
      } as any);

      const notifQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce([]),
      };
      mockedNotificationModel.find.mockReturnValueOnce(notifQuery as any);

      const annQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce([]),
      };
      mockedAnnouncementModel.find.mockReturnValueOnce(annQuery as any);

      // Test with only 'from'
      await getNotifications(userId, { from } as any);

      // Verify filter was applied correctly
      expect(mockedNotificationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUser: userId,
          isDeleted: false,
          createdAt: { $gte: from },
        })
      );
    });
  });

  describe("mark & delete operations", () => {
    it("marks single notification as read", async () => {
      const userId = new Types.ObjectId();
      const save = jest.fn().mockResolvedValue(undefined);
      mockedNotificationModel.findOne.mockResolvedValueOnce({
        isRead: false,
        save,
      } as any);

      const result = await markNotificationAsRead("nid", userId);
      expect(save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("marks multiple notifications as read", async () => {
      const userId = new Types.ObjectId();
      mockedNotificationModel.find.mockResolvedValueOnce([{ _id: "n1" }] as any);
      mockedNotificationModel.updateMany.mockResolvedValueOnce({} as any);

      const result = await markNotificationsAsRead(["n1"], userId);
      expect(result.count).toBe(1);
    });

    it("marks all notifications as read", async () => {
      const userId = new Types.ObjectId();
      mockedNotificationModel.updateMany.mockResolvedValueOnce({
        modifiedCount: 3,
      } as any);

      const result = await markAllNotificationsAsRead(userId);
      expect(result.count).toBe(3);
    });

    it("soft deletes a notification", async () => {
      const userId = new Types.ObjectId();
      const save = jest.fn().mockResolvedValue(undefined);
      mockedNotificationModel.findOne.mockResolvedValueOnce({
        isDeleted: false,
        save,
      } as any);

      const result = await deleteNotification("nid", userId);
      expect(save).toHaveBeenCalled();
      expect(result.deleted).toBe(true);
    });

    it("hard deletes a notification", async () => {
      const userId = new Types.ObjectId();
      mockedNotificationModel.findOne.mockResolvedValueOnce({ _id: "nid" } as any);
      mockedNotificationModel.deleteOne.mockResolvedValueOnce({} as any);

      const result = await hardDeleteNotification("nid", userId);
      expect(result.deleted).toBe(true);
    });

    it("returns unread notification count", async () => {
      const userId = new Types.ObjectId();
      mockedNotificationModel.countDocuments.mockResolvedValueOnce(5 as any);

      const result = await getUnreadNotificationCount(userId);
      expect(result.count).toBe(5);
    });

    it("undoes delete within allowed window", async () => {
      const userId = new Types.ObjectId();
      const save = jest.fn().mockResolvedValue(undefined);
      mockedNotificationModel.findOne.mockResolvedValueOnce({
        isDeleted: true,
        deletedAt: new Date(),
        save,
      } as any);

      const result = await undoDeleteNotification("nid", userId);
      expect(save).toHaveBeenCalled();
      expect(result.restored).toBe(true);
    });

    it("undoes delete when deletedAt is undefined (no time check)", async () => {
      const userId = new Types.ObjectId();
      const save = jest.fn().mockResolvedValue(undefined);
      mockedNotificationModel.findOne.mockResolvedValueOnce({
        isDeleted: true,
        deletedAt: undefined,
        save,
      } as any);

      const result = await undoDeleteNotification("nid2", userId);
      expect(save).toHaveBeenCalled();
      expect(result.restored).toBe(true);
    });
  });

  describe("getSubmissionStats", () => {
    it("throws error when assignment not found", async () => {
      // findById().populate(...) should resolve to null to simulate missing assignment
      mockedAssignmentModel.findById.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce(null) } as any);
      await expect(getSubmissionStats({ assignmentId: "a1" })).rejects.toThrow();
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

    it("returns 0 percentages when no students or submissions", async () => {
      const fakeAssignment: any = {
        courseId: { _id: "c1", teacherIds: [] },
      };
      mockedAssignmentModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(fakeAssignment),
      } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValueOnce(0 as any);
      mockedSubmissionModel.find.mockResolvedValueOnce([] as any);

      const stats = await getSubmissionStats({ assignmentId: "a1" });
      expect(stats.totalStudents).toBe(0);
      expect(stats.submissionRate).toBe("0%");
      expect(stats.onTimeRate).toBe("0%");
    });

    it("handles courseId as ObjectId directly (not populated object)", async () => {
      const courseIdObj = new mongoose.Types.ObjectId();
      const fakeAssignment: any = {
        courseId: courseIdObj, // Direct ObjectId, not populated object
      };
      mockedAssignmentModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(fakeAssignment),
      } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValueOnce(3 as any);
      mockedSubmissionModel.find.mockResolvedValueOnce([
        { status: "submitted", isLate: false, grade: 7 },
      ] as any);

      const stats = await getSubmissionStats({ assignmentId: "a1" });
      expect(stats.totalStudents).toBe(3);
      expect(mockedEnrollmentModel.countDocuments).toHaveBeenCalledWith({
        courseId: courseIdObj,
        status: EnrollmentStatus.APPROVED,
      });
    });

    it("returns null averageGrade when no graded submissions", async () => {
      const fakeAssignment: any = {
        courseId: { _id: "c1", teacherIds: [] },
      };
      mockedAssignmentModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(fakeAssignment),
      } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValueOnce(5 as any);
      mockedSubmissionModel.find.mockResolvedValueOnce([
        { status: "submitted", isLate: false }, // No grade
        { status: "overdue", isLate: true }, // No grade
      ] as any);

      const stats = await getSubmissionStats({ assignmentId: "a1" });
      expect(stats.averageGrade).toBeNull();
      expect(stats.totalStudents).toBe(5);
    });
  });

  describe("getGradeDistribution", () => {
    it("returns distribution correct counts", async () => {
      mockedSubmissionModel.find.mockResolvedValueOnce([
        { grade: 1 },
        { grade: 3 },
        { grade: 9 },
        { grade: 10 },
      ] as any);

      const dist = await getGradeDistribution("a1");
      expect(Array.isArray(dist)).toBe(true);
      expect(dist.some((d) => d.range === "0-2")).toBe(true);
    });

    it("returns distribution with total=1 when no submissions", async () => {
      mockedAssignmentModel.exists.mockResolvedValueOnce({ _id: "a1" } as any);
      mockedSubmissionModel.find.mockResolvedValueOnce([] as any);

      const dist = await getGradeDistribution("a1");
      expect(Array.isArray(dist)).toBe(true);
      expect(dist.length).toBe(5);
      // All percentages should be "0.00%" when total=1 and count=0
      dist.forEach((d) => {
        expect(d.count).toBe(0);
        expect(d.percentage).toBe("0.00%");
      });
    });
  });

  describe("getSubmissionReportByAssignment", () => {
    it("returns report object", async () => {
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

    it("applies date range filter for details query", async () => {
      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");

      const statsSpy = jest
        .spyOn(submissionServiceModule, "getSubmissionStats")
        .mockResolvedValueOnce({} as any);
      const distSpy = jest
        .spyOn(submissionServiceModule, "getGradeDistribution")
        .mockResolvedValueOnce([] as any);

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce([]),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(mockFind as any);

      const teacherId = new mongoose.Types.ObjectId();
      await getSubmissionReportByAssignment(
        "a1",
        { from, to } as any,
        teacherId,
        Role.TEACHER
      );

      expect(mockedSubmissionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: "a1",
          submittedAt: { $gte: from, $lte: to },
        })
      );

      statsSpy.mockRestore();
      distSpy.mockRestore();
    });

    it("applies date filter with only from or only to", async () => {
      const from = new Date("2024-01-01");
      
      mockedAssignmentModel.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: "c1" } }) } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValue(3 as any);
      mockedSubmissionModel.find
        .mockResolvedValueOnce([{ status: "submitted" }] as any)
        .mockResolvedValueOnce([{ grade: 5 }] as any)
        .mockReturnValueOnce({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValueOnce([]) } as any);

      const teacherId = new mongoose.Types.ObjectId();
      await getSubmissionReportByAssignment("a1", { from } as any, teacherId, Role.TEACHER);

      // Verify filter was applied with only 'from'
      expect(mockedSubmissionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentId: "a1",
          submittedAt: { $gte: from },
        })
      );
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

    it("handles assignment _id with toHexString method", async () => {
      const assignmentId = new mongoose.Types.ObjectId();
      const mockAssignment = {
        _id: {
          toHexString: jest.fn().mockReturnValue(assignmentId.toString()),
        },
        title: "A2",
      };

      mockedAssignmentModel.find.mockResolvedValueOnce([mockAssignment] as any);
      mockedAssignmentModel.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ courseId: { _id: "c1" } }) } as any);
      mockedEnrollmentModel.countDocuments.mockResolvedValue(1 as any);
      mockedSubmissionModel.find
        .mockResolvedValueOnce([{ status: "submitted" }] as any)
        .mockResolvedValueOnce([{ grade: 8 }] as any);

      const teacherId = new mongoose.Types.ObjectId();
      const reports = await getSubmissionReportByCourse("c1", teacherId, Role.TEACHER);
      
      expect(reports).toHaveLength(1);
      expect(mockAssignment._id.toHexString).toHaveBeenCalled();
    });
  });

  describe("listAllGradesByStudent", () => {
    it("returns empty result when no submissions", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);
      // chain: find().populate().populate().sort()
      const query: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce([]),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(query);

      const result = await listAllGradesByStudent(studentId);

      expect(result.total).toBe(0);
      expect(result.grades).toEqual([]);
    });

    it("returns mapped grades with course and assignment info", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);

      const submissions: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          assignmentId: {
            courseId: { title: "Course 1" },
            title: "Assignment 1",
            maxScore: 10,
          },
          grade: 9,
          feedback: "Good job",
          status: SubmissionStatus.GRADED,
          isLate: false,
          submittedAt: new Date(),
          gradedAt: new Date(),
          gradedBy: { fullname: "Teacher A" },
        },
      ];

      const query: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce(submissions),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(query);

      const result = await listAllGradesByStudent(studentId);

      expect(result.total).toBe(1);
      expect(result.grades).toHaveLength(1);
      const g = result.grades[0];
      expect(g.courseName).toBe("Course 1");
      expect(g.assignmentTitle).toBe("Assignment 1");
      expect(g.maxScore).toBe(10);
      expect(g.grade).toBe(9);
      expect(g.teacher).toBe("Teacher A");
    });

    it("applies from/to filters in query", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);

      const from = new Date("2024-01-01");
      const to = new Date("2024-12-31");

      const submissions: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          assignmentId: {},
          grade: null,
          feedback: "",
          status: SubmissionStatus.SUBMITTED,
          isLate: false,
          submittedAt: new Date(),
          gradedAt: null,
          gradedBy: null,
        },
      ];

      const query: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce(submissions),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(query);

      const result = await listAllGradesByStudent(studentId, from, to);

      expect(mockedSubmissionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId,
          submittedAt: { $gte: from, $lte: to },
        })
      );
      expect(result.total).toBe(1);
    });

    it("handles undefined/null feedback in grades mapping", async () => {
      const studentId = new mongoose.Types.ObjectId();
      mockedUserModel.findOne.mockResolvedValueOnce({
        _id: studentId,
        role: Role.STUDENT,
      } as any);

      const submissions: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          assignmentId: {
            courseId: { title: "Course 1" },
            title: "Assignment 1",
            maxScore: 10,
          },
          grade: 8,
          feedback: undefined, // Test undefined feedback -> should become ""
          status: SubmissionStatus.GRADED,
          isLate: false,
          submittedAt: new Date(),
          gradedAt: new Date(),
          gradedBy: { fullname: "Teacher B" },
        },
        {
          _id: new mongoose.Types.ObjectId(),
          assignmentId: {
            courseId: { title: "Course 2" },
            title: "Assignment 2",
            maxScore: 10,
          },
          grade: 9,
          feedback: null, // Test null feedback -> should become ""
          status: SubmissionStatus.GRADED,
          isLate: false,
          submittedAt: new Date(),
          gradedAt: new Date(),
          gradedBy: null, // Test null gradedBy -> teacher should be null
        },
      ];

      const query: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce(submissions),
      };
      mockedSubmissionModel.find.mockReturnValueOnce(query);

      const result = await listAllGradesByStudent(studentId);

      expect(result.total).toBe(2);
      expect(result.grades[0].feedback).toBe("");
      expect(result.grades[1].feedback).toBe("");
      expect(result.grades[0].teacher).toBe("Teacher B");
      expect(result.grades[1].teacher).toBeNull();
    });
  });
});
