import AssignmentModel from "@/models/assignment.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import AnnouncementModel from "@/models/announcement.model";
import appAssert from "@/utils/appAssert";
import { Role } from "@/types";
import mongoose from "mongoose";
import {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/services/assignment.service";

//  Mock các module
jest.mock("@/models/assignment.model");
jest.mock("@/models/course.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/announcement.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile", () => ({
  uploadFile: jest.fn().mockResolvedValue({
    key: "test-key",
    originalName: "test.pdf",
    mimeType: "application/pdf",
    size: 1024,
  }),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/file"),
  removeFile: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils/filePrefix", () => ({
  prefixAssignmentFile: jest.fn().mockReturnValue("assignments/course1/ass1"),
}));
jest.mock("@/services/helpers/courseAccessHelpers", () => ({
  ensureTeacherAccessToCourse: jest.fn().mockResolvedValue(undefined),
}));
// test list assignments
describe("Assignments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("GET /assignments", () => {
    it("should return paginated assignments", async () => {
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ title: "Math HW" }]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(1);

      const result = await listAssignments({ page: 1, limit: 10 });

      expect(result.assignments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(AssignmentModel.find).toHaveBeenCalled();
    });

    it("should filter by courseId", async () => {
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({ page: 1, limit: 10, courseId });

      expect(AssignmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ courseId })
      );
    });

    it("should filter by search term", async () => {
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({ page: 1, limit: 10, search: "Math" });

      expect(AssignmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: expect.any(Object) },
            { description: expect.any(Object) },
          ]),
        })
      );
    });

    it("should return empty result for student with no approved enrollments", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      (EnrollmentModel.find as any).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const result = await listAssignments({
        page: 1,
        limit: 10,
        userId,
        userRole: Role.STUDENT,
      });

      expect(result.assignments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should filter by approved courses for student", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      (EnrollmentModel.find as any).mockReturnValue({
        select: jest.fn().mockResolvedValue([{ courseId }]),
      });
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({
        page: 1,
        limit: 10,
        userId,
        userRole: Role.STUDENT,
      });

      expect(AssignmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: { $in: [courseId] },
        })
      );
    });

    it("should filter by teacher courses", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      (CourseModel.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: courseId }]),
      });
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({
        page: 1,
        limit: 10,
        userId,
        userRole: Role.TEACHER,
      });

      expect(AssignmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: { $in: [courseId] },
        })
      );
    });

    it("should check enrollment for student when courseId is provided", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

      (EnrollmentModel.findOne as any).mockResolvedValue({
        studentId: userId,
        courseId,
        status: "APPROVED",
      });
      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({
        page: 1,
        limit: 10,
        courseId,
        userId,
        userRole: Role.STUDENT,
      });

      expect(EnrollmentModel.findOne).toHaveBeenCalledWith({
        studentId: userId,
        courseId,
        status: expect.any(String),
      });
    });

    it("should call ensureTeacherAccessToCourse when teacher filters by specific course", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

      const ensureTeacherAccessToCourse =
        require("@/services/helpers/courseAccessHelpers")
          .ensureTeacherAccessToCourse;

      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({
        page: 1,
        limit: 10,
        courseId,
        userId,
        userRole: Role.TEACHER,
      });

      expect(ensureTeacherAccessToCourse).toHaveBeenCalledWith({
        courseId,
        userId,
        userRole: Role.TEACHER,
      });
    });

    it("should return empty result when teacher has no courses", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");

      (CourseModel.find as any).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await listAssignments({
        page: 1,
        limit: 10,
        userId,
        userRole: Role.TEACHER,
      });

      expect(result.assignments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should apply due date and createdAt filters", async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000 * 60 * 60);

      (AssignmentModel.find as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      (AssignmentModel.countDocuments as any).mockResolvedValue(0);

      await listAssignments({
        page: 1,
        limit: 10,
        dueAfter: now,
        dueBefore: later,
      });

      expect(AssignmentModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: now,
            $lte: later,
          }),
          dueDate: expect.objectContaining({
            $gte: now,
            $lte: later,
          }),
        })
      );
    });
  });
  // assignment detail
  describe("GET /assignments/:id", () => {
    it("should return assignment when found", async () => {
      const mockAssignment = {
        _id: "1",
        title: "Math HW",
        courseId: { _id: "course1" },
      };
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAssignment),
      });

      const result = await getAssignmentById("1");

      expect(result).toEqual({
        ...mockAssignment,
        publicURL: null,
      });
    });

    it("should return assignment with publicURL when fileKey exists", async () => {
      const mockAssignment = {
        _id: "1",
        title: "Math HW",
        courseId: { _id: "course1" },
        fileKey: "test-key",
        fileOriginalName: "test.pdf",
      };
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAssignment),
      });

      const { getSignedUrl } = require("@/utils/uploadFile");
      getSignedUrl.mockResolvedValue("https://signed-url.com/file");

      const result = await getAssignmentById("1");

      expect(result).toEqual({
        ...mockAssignment,
        publicURL: "https://signed-url.com/file",
      });
      expect(getSignedUrl).toHaveBeenCalledWith("test-key", "test.pdf");
    });

    it("should check enrollment for student role", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const mockAssignment = {
        _id: "1",
        title: "Math HW",
        courseId: { _id: courseId },
      };
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAssignment),
      });
      (EnrollmentModel.findOne as any).mockResolvedValue({
        studentId: userId,
        courseId,
        status: "APPROVED",
      });

      const result = await getAssignmentById("1", userId, Role.STUDENT);

      expect(result).toEqual({
        ...mockAssignment,
        publicURL: null,
      });
      expect(EnrollmentModel.findOne).toHaveBeenCalled();
    });

    it("should call appAssert when not found", async () => {
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      (appAssert as jest.Mock).mockImplementation((value, code, message) => {
        if (!value) {
          throw new Error(message);
        }
      });

      await expect(getAssignmentById("999")).rejects.toThrow(
        "Assignment not found"
      );

      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });
  });
  //creat assignments
  describe("POST /assignments", () => {
    it("should create assignment when course exists", async () => {
      const mockCourse = { _id: "C1" };
      const mockCreatedAssignment = {
        _id: "A1",
        title: "Test HW",
        courseId: "C1",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPopulatedAssignment = { _id: "A1", title: "Test HW" };

      (CourseModel.findById as any).mockResolvedValue(mockCourse);
      (AssignmentModel.create as any).mockResolvedValue(mockCreatedAssignment);
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPopulatedAssignment),
      });

      const result = await createAssignment({
        title: "Test HW",
        courseId: "C1",
      });

      expect(result!._id).toBe("A1");
      expect(CourseModel.findById).toHaveBeenCalledWith("C1");
      expect(AssignmentModel.create).toHaveBeenCalled();
    });

    it("should create assignment with file", async () => {
      const mockCourse = { _id: "C1" };
      const mockCreatedAssignment = {
        _id: "A1",
        title: "Test HW",
        courseId: "C1",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPopulatedAssignment = { _id: "A1", title: "Test HW" };
      const mockFile = {
        fieldname: "file",
        originalname: "test.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: 1024,
      } as Express.Multer.File;

      (CourseModel.findById as any).mockResolvedValue(mockCourse);
      (AssignmentModel.create as any).mockResolvedValue(mockCreatedAssignment);
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPopulatedAssignment),
      });

      const { uploadFile } = require("@/utils/uploadFile");

      const result = await createAssignment(
        { title: "Test HW", courseId: "C1" },
        undefined,
        undefined,
        mockFile
      );

      expect(result!._id).toBe("A1");
      expect(uploadFile).toHaveBeenCalled();
      expect(mockCreatedAssignment.save).toHaveBeenCalled();
    });

    it("should create announcement when teacher creates assignment", async () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const courseId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const mockCourse = { _id: courseId, title: "Math Course" };
      const mockCreatedAssignment = {
        _id: "A1",
        title: "Test HW",
        courseId,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockPopulatedAssignment = { _id: "A1", title: "Test HW" };

      (CourseModel.findById as any).mockResolvedValue(mockCourse);
      (AssignmentModel.create as any).mockResolvedValue(mockCreatedAssignment);
      (AssignmentModel.findById as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPopulatedAssignment),
      });
      (AnnouncementModel.create as any).mockResolvedValue({});

      await createAssignment(
        { title: "Test HW", courseId },
        userId,
        Role.TEACHER
      );

      expect(AnnouncementModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("New assignment"),
          courseId,
          authorId: userId,
        })
      );
    });

    it("should call appAssert if course not found", async () => {
      (CourseModel.findById as any).mockResolvedValue(null);
      (appAssert as jest.Mock).mockImplementation((value, code, message) => {
        if (!value) {
          throw new Error(message);
        }
      });

      await expect(
        createAssignment({ title: "Test", courseId: "invalid" })
      ).rejects.toThrow("Course not found");

      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Course not found"
      );
    });
  });

  describe("updateAssignment", () => {
    it("should update assignment", async () => {
      const mockAssignment = {
        _id: "A1",
        courseId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        fileKey: null,
      };
      const mockUpdated = { _id: "A1", title: "Updated HW" };

      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAssignment),
      });
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const result = await updateAssignment("A1", { title: "Updated HW" });
      expect(result).toEqual(mockUpdated);
      expect(AssignmentModel.findById).toHaveBeenCalledWith("A1");
    });

    it("should update assignment with file", async () => {
      const mockAssignment = {
        _id: "A1",
        courseId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        fileKey: "old-key",
      };
      const mockUpdated = { _id: "A1", title: "Updated HW", fileKey: "new-key" };
      const mockFile = {
        fieldname: "file",
        originalname: "updated.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: 2048,
      } as Express.Multer.File;

      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAssignment),
      });
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const { removeFile, uploadFile } = require("@/utils/uploadFile");

      const result = await updateAssignment("A1", { title: "Updated HW" }, undefined, undefined, mockFile);
      
      expect(result).toEqual(mockUpdated);
      expect(removeFile).toHaveBeenCalledWith("old-key");
      expect(uploadFile).toHaveBeenCalled();
    });

    it("should check teacher access when updating assignment as teacher", async () => {
      const mockAssignment = {
        _id: "A1",
        courseId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        fileKey: null,
      };
      const mockUpdated = { _id: "A1", title: "Updated HW" };
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");

      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAssignment),
      });
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUpdated),
      });

      const { ensureTeacherAccessToCourse } = require("@/services/helpers/courseAccessHelpers");

      const result = await updateAssignment(
        "A1",
        { title: "Updated HW" },
        userId,
        Role.TEACHER
      );

      expect(result).toEqual(mockUpdated);
      expect(ensureTeacherAccessToCourse).toHaveBeenCalledWith({
        courseId: mockAssignment.courseId,
        userId,
        userRole: Role.TEACHER,
      });
    });

    it("should call appAssert if assignment not found", async () => {
      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      (appAssert as jest.Mock).mockImplementation((value, code, message) => {
        if (!value) {
          throw new Error(message);
        }
      });

      await expect(updateAssignment("404", { title: "Not Found" })).rejects.toThrow(
        "Assignment not found"
      );

      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });

    it("should call appAssert if assignment not found after update", async () => {
      const mockAssignment = {
        _id: "A1",
        courseId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        fileKey: null,
      };

      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAssignment),
      });
      (AssignmentModel.findByIdAndUpdate as any).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });
      (appAssert as jest.Mock).mockImplementation((value, code, message) => {
        if (!value) {
          throw new Error(message);
        }
      });

      await expect(updateAssignment("404", { title: "Not Found" })).rejects.toThrow(
        "Assignment not found"
      );
    });
  });

  describe("deleteAssignment", () => {
    it("should delete assignment", async () => {
      (AssignmentModel.findByIdAndDelete as any).mockResolvedValue({
        _id: "A1",
      });
      const result = await deleteAssignment("A1");
      expect(result._id).toBe("A1");
    });

    it("should delete assignment with teacher role check", async () => {
      const mockAssignment = {
        _id: "A1",
        courseId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      };
      (AssignmentModel.findById as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAssignment),
      });
      (AssignmentModel.findByIdAndDelete as any).mockResolvedValue({
        _id: "A1",
      });

      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      const result = await deleteAssignment("A1", userId, Role.TEACHER);

      expect(result._id).toBe("A1");
      expect(AssignmentModel.findById).toHaveBeenCalledWith("A1");
    });

    it("should call appAssert if not found", async () => {
      (AssignmentModel.findByIdAndDelete as any).mockResolvedValue(null);
      (appAssert as jest.Mock).mockImplementation((value, code, message) => {
        if (!value) {
          throw new Error(message);
        }
      });

      await expect(deleteAssignment("404")).rejects.toThrow(
        "Assignment not found"
      );

      expect(appAssert).toHaveBeenCalledWith(
        null,
        expect.anything(),
        "Assignment not found"
      );
    });
  });
});
