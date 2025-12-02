// Unit tests for announcement.service.ts
import {
  createAnnouncement,
  getAnnouncementsByCourse,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  getSystemAnnouncements,
} from "@/services/announcement.service";
import AnnouncementModel from "@/models/announcement.model";
import CourseModel from "@/models/course.model";
import { AppError } from "@/utils/AppError";
import { Role } from "@/types";
import { Types } from "mongoose";

jest.mock("@/models/announcement.model", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("@/models/course.model", () => ({
  findById: jest.fn(),
}));

describe("Announcement Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAnnouncement", () => {
    const mockUserId = new Types.ObjectId();
    const mockCourseId = new Types.ObjectId();

    it("Should create course announcement successfully as admin", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [] };
      const mockAnnouncement = {
        _id: new Types.ObjectId(),
        title: "Test Announcement",
        content: "Test content here",
        courseId: mockCourseId,
        authorId: mockUserId,
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (AnnouncementModel.create as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await createAnnouncement(
        { title: "Test Announcement", content: "Test content here", courseId: mockCourseId.toString() },
        mockUserId,
        Role.ADMIN
      );

      expect(result).toBeDefined();
      expect(AnnouncementModel.create).toHaveBeenCalled();
    });

    it("Should create course announcement successfully as teacher of the course", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [mockUserId] };
      const mockAnnouncement = {
        _id: new Types.ObjectId(),
        title: "Test Announcement",
        content: "Test content here",
        courseId: mockCourseId,
        authorId: mockUserId,
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (AnnouncementModel.create as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await createAnnouncement(
        { title: "Test Announcement", content: "Test content here", courseId: mockCourseId.toString() },
        mockUserId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
    });

    it("Should create system announcement successfully as admin", async () => {
      const mockAnnouncement = {
        _id: new Types.ObjectId(),
        title: "System Announcement",
        content: "System content here",
        authorId: mockUserId,
      };

      (AnnouncementModel.create as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await createAnnouncement(
        { title: "System Announcement", content: "System content here" },
        mockUserId,
        Role.ADMIN
      );

      expect(result).toBeDefined();
      expect(CourseModel.findById).not.toHaveBeenCalled();
    });

    it("Should throw NOT_FOUND when course does not exist", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        createAnnouncement(
          { title: "Test", content: "Test content", courseId: mockCourseId.toString() },
          mockUserId,
          Role.ADMIN
        )
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when teacher is not assigned to course", async () => {
      const otherTeacherId = new Types.ObjectId();
      const mockCourse = { _id: mockCourseId, title: "Test Course", teacherIds: [otherTeacherId] };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);

      await expect(
        createAnnouncement(
          { title: "Test", content: "Test content", courseId: mockCourseId.toString() },
          mockUserId,
          Role.TEACHER
        )
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when non-admin tries to create system announcement", async () => {
      await expect(
        createAnnouncement(
          { title: "System Announcement", content: "System content here" },
          mockUserId,
          Role.TEACHER
        )
      ).rejects.toThrow(AppError);
    });

  });


  describe("getAnnouncementsByCourse", () => {
    const mockCourseId = new Types.ObjectId().toString();

    it("Should return paginated announcements for a course", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course" };
      const mockAnnouncements = [
        { _id: new Types.ObjectId(), title: "Announcement 1", content: "Content 1" },
        { _id: new Types.ObjectId(), title: "Announcement 2", content: "Content 2" },
      ];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAnnouncements),
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await getAnnouncementsByCourse(mockCourseId, 1, 10);

      expect(result.announcements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("Should throw NOT_FOUND when course does not exist", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(getAnnouncementsByCourse(mockCourseId, 1, 10)).rejects.toThrow(AppError);
    });

    it("Should use default pagination values", async () => {
      const mockCourse = { _id: mockCourseId, title: "Test Course" };
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(mockCourse);
      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await getAnnouncementsByCourse(mockCourseId);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe("getAnnouncementById", () => {
    const mockAnnouncementId = new Types.ObjectId().toString();

    it("Should return announcement details", async () => {
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        title: "Test Announcement",
        content: "Test content",
        authorId: { username: "teacher1" },
        courseId: { title: "Test Course" },
      };
      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAnnouncement),
      };

      (AnnouncementModel.findById as jest.Mock).mockReturnValue(mockFindById);

      const result = await getAnnouncementById(mockAnnouncementId);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Announcement");
    });

    it("Should throw NOT_FOUND when announcement does not exist", async () => {
      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };

      (AnnouncementModel.findById as jest.Mock).mockReturnValue(mockFindById);

      await expect(getAnnouncementById(mockAnnouncementId)).rejects.toThrow(AppError);
    });
  });

  describe("updateAnnouncement", () => {
    const mockAnnouncementId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId();

    it("Should update announcement successfully as admin", async () => {
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        title: "Old Title",
        content: "Old content",
        authorId: new Types.ObjectId(),
      };
      const mockUpdatedAnnouncement = {
        _id: mockAnnouncementId,
        title: "New Title",
        content: "New content",
      };
      const mockFindByIdAndUpdate = {
        lean: jest.fn().mockResolvedValue(mockUpdatedAnnouncement),
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);
      (AnnouncementModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockFindByIdAndUpdate);

      const result = await updateAnnouncement(
        mockAnnouncementId,
        { title: "New Title", content: "New content" },
        mockUserId,
        Role.ADMIN
      );

      expect(result).toBeDefined();
      expect(result!.title).toBe("New Title");
    });

    it("Should update announcement successfully as author", async () => {
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        title: "Old Title",
        content: "Old content",
        authorId: mockUserId,
      };
      const mockUpdatedAnnouncement = {
        _id: mockAnnouncementId,
        title: "New Title",
      };
      const mockFindByIdAndUpdate = {
        lean: jest.fn().mockResolvedValue(mockUpdatedAnnouncement),
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);
      (AnnouncementModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockFindByIdAndUpdate);

      const result = await updateAnnouncement(
        mockAnnouncementId,
        { title: "New Title" },
        mockUserId,
        Role.TEACHER
      );

      expect(result).toBeDefined();
      expect(result!.title).toBe("New Title");
    });

    it("Should throw NOT_FOUND when announcement does not exist", async () => {
      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        updateAnnouncement(mockAnnouncementId, { title: "New Title" }, mockUserId, Role.ADMIN)
      ).rejects.toThrow(AppError);
    });

    it("Should throw FORBIDDEN when user is not admin or author", async () => {
      const otherUserId = new Types.ObjectId();
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        authorId: otherUserId,
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);

      await expect(
        updateAnnouncement(mockAnnouncementId, { title: "New Title" }, mockUserId, Role.TEACHER)
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteAnnouncement", () => {
    const mockAnnouncementId = new Types.ObjectId().toString();
    const mockUserId = new Types.ObjectId();

    it("Should delete announcement successfully as admin", async () => {
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        authorId: new Types.ObjectId(),
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);
      (AnnouncementModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await deleteAnnouncement(mockAnnouncementId, mockUserId, Role.ADMIN);

      expect(result.message).toBe("Announcement deleted successfully");
      expect(AnnouncementModel.findByIdAndDelete).toHaveBeenCalledWith(mockAnnouncementId);
    });

    it("Should delete announcement successfully as author", async () => {
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        authorId: mockUserId,
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);
      (AnnouncementModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockAnnouncement);

      const result = await deleteAnnouncement(mockAnnouncementId, mockUserId, Role.TEACHER);

      expect(result.message).toBe("Announcement deleted successfully");
    });

    it("Should throw NOT_FOUND when announcement does not exist", async () => {
      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(deleteAnnouncement(mockAnnouncementId, mockUserId, Role.ADMIN)).rejects.toThrow(
        AppError
      );
    });

    it("Should throw FORBIDDEN when user is not admin or author", async () => {
      const otherUserId = new Types.ObjectId();
      const mockAnnouncement = {
        _id: mockAnnouncementId,
        authorId: otherUserId,
      };

      (AnnouncementModel.findById as jest.Mock).mockResolvedValue(mockAnnouncement);

      await expect(
        deleteAnnouncement(mockAnnouncementId, mockUserId, Role.TEACHER)
      ).rejects.toThrow(AppError);
    });
  });

  describe("getAllAnnouncements", () => {
    it("Should return all announcements with pagination", async () => {
      const mockAnnouncements = [
        { _id: new Types.ObjectId(), title: "Announcement 1" },
        { _id: new Types.ObjectId(), title: "Announcement 2" },
      ];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAnnouncements),
      };

      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await getAllAnnouncements(1, 10);

      expect(result.announcements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

  });

  describe("getSystemAnnouncements", () => {
    it("Should return system announcements with pagination", async () => {
      const mockAnnouncements = [
        { _id: new Types.ObjectId(), title: "System Announcement 1" },
        { _id: new Types.ObjectId(), title: "System Announcement 2" },
      ];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAnnouncements),
      };

      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await getSystemAnnouncements(1, 10);

      expect(result.announcements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(AnnouncementModel.find).toHaveBeenCalledWith({ courseId: { $exists: false } });
    });

    it("Should use default pagination values", async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await getSystemAnnouncements();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("Should calculate totalPages correctly", async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await getSystemAnnouncements(1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });

    it("Should handle page 2 with skip calculation", async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (AnnouncementModel.find as jest.Mock).mockReturnValue(mockFind);
      (AnnouncementModel.countDocuments as jest.Mock).mockResolvedValue(15);

      const result = await getSystemAnnouncements(2, 10);

      expect(result.pagination.page).toBe(2);
      expect(mockFind.skip).toHaveBeenCalledWith(10);
    });
  });
});
