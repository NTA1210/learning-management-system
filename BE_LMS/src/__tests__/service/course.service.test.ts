// Course Service Unit Tests
import mongoose from "mongoose";
import { Role, UserStatus } from "@/types";
import { CourseStatus } from "@/types/course.type";

// Mock all models before importing services
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/subject.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile", () => ({
  uploadFile: jest.fn().mockResolvedValue({ publicUrl: "http://test.com/logo.png", key: "test-key" }),
  removeFile: jest.fn().mockResolvedValue(undefined),
}));

// Import models for mocking
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import EnrollmentModel from "@/models/enrollment.model";
import SubjectModel from "@/models/subject.model";
import appAssert from "@/utils/appAssert";
import { uploadFile, removeFile } from "@/utils/uploadFile";

// Import services
import {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
  ListCoursesParams,
} from "@/services/course.service";

describe("📚 Course Service Unit Tests", () => {
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let subject: any;
  let course: any;

  beforeEach(() => {
    // Create mock data
    adminUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "admin_test",
      email: "admin@test.com",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    };

    teacherUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "teacher_test",
      email: "teacher@test.com",
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
    };

    studentUser = {
      _id: new mongoose.Types.ObjectId(),
      username: "student_test",
      email: "student@test.com",
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    };

    subject = {
      _id: new mongoose.Types.ObjectId(),
      name: "Software Engineering",
      code: "SE101",
      slug: "software-engineering",
      isActive: true,
      credits: 3,
    };

    course = {
      _id: new mongoose.Types.ObjectId(),
      title: "Introduction to Programming",
      description: "Learn programming basics",
      subjectId: subject._id,
      teacherIds: [teacherUser._id],
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-06-01"),
      status: CourseStatus.DRAFT,
      isPublished: false,
      isDeleted: false,
      createdBy: adminUser._id,
    };

    // Reset all mocks
    jest.clearAllMocks();

    // appAssert: throw Error(message) when condition falsy
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });
  });

  // ====================================
  // LIST COURSES TESTS
  // ====================================
  describe("listCourses", () => {
    it("should list courses with pagination for admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([course]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.ADMIN,
      };

      const result = await listCourses(params);

      expect(result).toBeDefined();
      expect(result.courses).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(CourseModel.find).toHaveBeenCalled();
    });

    it("should filter courses by search term", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([course]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        search: "Programming",
        userRole: Role.ADMIN,
      };

      const result = await listCourses(params);

      expect(result).toBeDefined();
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $regex: "Programming", $options: "i" } },
            { description: { $regex: "Programming", $options: "i" } },
          ],
        })
      );
    });

    it("should filter by subject ID", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([course]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        subjectId: subject._id.toString(),
        userRole: Role.ADMIN,
      };

      const result = await listCourses(params);

      expect(result).toBeDefined();
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ subjectId: subject._id.toString() })
      );
    });

    it("should hide deleted courses for non-admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([course]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.STUDENT,
      };

      await listCourses(params);

      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false })
      );
    });

    it("should throw error for invalid page number", async () => {
      const params: ListCoursesParams = {
        page: 0,
        limit: 10,
        userRole: Role.ADMIN,
      };

      await expect(listCourses(params)).rejects.toThrow("Page must be between 1 and 10000");
    });

    it("should throw error for invalid limit", async () => {
      const params: ListCoursesParams = {
        page: 1,
        limit: 101,
        userRole: Role.ADMIN,
      };

      await expect(listCourses(params)).rejects.toThrow("Limit must be between 1 and 100");
    });
  });

  // ====================================
  // GET COURSE BY ID TESTS
  // ====================================
  describe("getCourseById", () => {
    it("should get course by ID successfully", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await getCourseById(course._id.toString());

      expect(result).toBeDefined();
      expect(result.title).toBe("Introduction to Programming");
      expect(CourseModel.findOne).toHaveBeenCalledWith({
        _id: course._id.toString(),
        isDeleted: false,
      });
    });

    it("should throw error for invalid course ID format", async () => {
      await expect(getCourseById("invalid-id")).rejects.toThrow("Invalid course ID format");
    });

    it("should throw error when course not found", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const validId = new mongoose.Types.ObjectId().toString();
      await expect(getCourseById(validId)).rejects.toThrow("Course not found");
    });
  });

  // ====================================
  // CREATE COURSE TESTS
  // ====================================
  describe("createCourse", () => {
    it("should create course successfully by admin", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        description: "Test course",
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      const result = await createCourse(courseData, adminUser._id.toString());

      expect(result).toBeDefined();
      expect(CourseModel.create).toHaveBeenCalled();
    });

    it("should prevent teacher from publishing course", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: true, // Teacher tries to publish
        enrollRequiresApproval: false,
      };

      await createCourse(courseData, teacherUser._id.toString());

      // Verify isPublished was forced to false
      expect(CourseModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: false })
      );
    });

    it("should throw error when subject not found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("Subject not found");
    });

    it("should throw error when subject is inactive", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue({ ...subject, isActive: false });

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("Cannot create course for inactive subject");
    });

    it("should throw error for duplicate teacher IDs", async () => {
      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString(), teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("Teacher list contains duplicate entries");
    });

    it("should throw error when end date before start date", async () => {
      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-01-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("End date must be after start date");
    });

    it("should throw error when teacher is not active", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([
        { ...teacherUser, status: UserStatus.INACTIVE },
      ]);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("Cannot assign inactive or banned teachers to course");
    });
  });

  // ====================================
  // UPDATE COURSE TESTS
  // ====================================
  describe("updateCourse", () => {
    it("should update course successfully by admin", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...course, title: "Updated Title" }),
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        title: "Updated Title",
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should update course by course teacher", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        description: "Updated description",
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        teacherUser._id.toString()
      );

      expect(result).toBeDefined();
    });

    it("should prevent teacher from publishing course", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        isPublished: true,
        startDate: undefined,
        endDate: undefined,
      };

      await updateCourse(course._id.toString(), updateData, teacherUser._id.toString());

      // Verify isPublished was removed from update
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        course._id.toString(),
        expect.not.objectContaining({ $set: expect.objectContaining({ isPublished: true }) }),
        expect.any(Object)
      );
    });

    it("should throw error when updating completed course", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue({
        ...course,
        status: CourseStatus.COMPLETED,
      });

      const updateData = { 
        title: "New Title",
        startDate: undefined,
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString())
      ).rejects.toThrow("Cannot update a completed course");
    });

    it("should throw error when user has no permission", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

      const updateData = { 
        title: "New Title",
        startDate: undefined,
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, studentUser._id.toString())
      ).rejects.toThrow("You don't have permission to update this course");
    });

    it("should throw error when course not found", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);

      const updateData = { 
        title: "New Title",
        startDate: undefined,
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString())
      ).rejects.toThrow("Course not found");
    });
  });

  // ====================================
  // DELETE COURSE TESTS
  // ====================================
  describe("deleteCourse", () => {
    it("should soft delete course successfully by admin", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(course);

      const result = await deleteCourse(course._id.toString(), adminUser._id.toString());

      expect(result).toBeDefined();
      expect(result.message).toBe("Course deleted successfully");
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        course._id.toString(),
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: true }),
        }),
        expect.any(Object)
      );
    });

    it("should throw error when deleting ongoing course", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue({
        ...course,
        status: CourseStatus.ONGOING,
      });

      await expect(
        deleteCourse(course._id.toString(), adminUser._id.toString())
      ).rejects.toThrow("Cannot delete an ongoing course");
    });

    it("should throw error when course has active enrollments", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(5);

      await expect(
        deleteCourse(course._id.toString(), adminUser._id.toString())
      ).rejects.toThrow("Cannot delete course with 5 active enrollment(s)");
    });

    it("should throw error when user has no permission", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(0);

      await expect(
        deleteCourse(course._id.toString(), studentUser._id.toString())
      ).rejects.toThrow("You don't have permission to delete this course");
    });
  });

  // ====================================
  // RESTORE COURSE TESTS
  // ====================================
  describe("restoreCourse", () => {
    it("should restore deleted course by admin", async () => {
      const deletedCourse = { ...course, isDeleted: true };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const result = await restoreCourse(course._id.toString(), adminUser._id.toString());

      expect(result).toBeDefined();
      expect(result.message).toBe("Course restored successfully");
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        course._id.toString(),
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: false }),
        }),
        expect.any(Object)
      );
    });

    it("should throw error when non-admin tries to restore", async () => {
      const deletedCourse = { ...course, isDeleted: true };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);

      await expect(
        restoreCourse(course._id.toString(), teacherUser._id.toString())
      ).rejects.toThrow("Only administrators can restore deleted courses");
    });

    it("should throw error when deleted course not found", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        restoreCourse(course._id.toString(), adminUser._id.toString())
      ).rejects.toThrow("Deleted course not found");
    });
  });

  // ====================================
  // PERMANENT DELETE COURSE TESTS
  // ====================================
  describe("permanentDeleteCourse", () => {
    it("should permanently delete course by admin", async () => {
      const deletedCourse = { ...course, isDeleted: true };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedCourse);

      const result = await permanentDeleteCourse(
        course._id.toString(),
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
      expect(result.message).toBe("Course permanently deleted successfully");
      expect(result.warning).toBe("This action cannot be undone");
      expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id.toString());
    });

    it("should throw error when trying to permanently delete non-deleted course", async () => {
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        permanentDeleteCourse(course._id.toString(), adminUser._id.toString())
      ).rejects.toThrow("Course not found in recycle bin");
    });

    it("should throw error when non-admin tries to permanently delete", async () => {
      const deletedCourse = { ...course, isDeleted: true };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);

      await expect(
        permanentDeleteCourse(course._id.toString(), teacherUser._id.toString())
      ).rejects.toThrow("Only administrators can permanently delete courses");
    });

    it("should throw error when course has enrollments", async () => {
      const deletedCourse = { ...course, isDeleted: true };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(3);

      await expect(
        permanentDeleteCourse(course._id.toString(), adminUser._id.toString())
      ).rejects.toThrow("Cannot permanently delete course with 3 enrollment(s)");
    });
  });
});

