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

    // Reset uploadFile and removeFile to default implementations
    (uploadFile as jest.Mock).mockResolvedValue({ publicUrl: "http://test.com/logo.png", key: "test-key" });
    (removeFile as jest.Mock).mockResolvedValue(undefined);

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

    it("should throw error for invalid sortBy field", async () => {
      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        sortBy: "invalidField",
        userRole: Role.ADMIN,
      };

      await expect(listCourses(params)).rejects.toThrow("Invalid sort field");
    });

    it("should throw error for invalid subjectId format", async () => {
      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        subjectId: "invalid-id",
        userRole: Role.ADMIN,
      };

      await expect(listCourses(params)).rejects.toThrow("Invalid subject ID format");
    });

    it("should throw error for invalid teacherId format", async () => {
      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        teacherId: "invalid-id",
        userRole: Role.ADMIN,
      };

      await expect(listCourses(params)).rejects.toThrow("Invalid teacher ID format");
    });

    it("should handle includeDeleted for non-admin user", async () => {
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
        includeDeleted: true,
        userRole: Role.STUDENT,
      };

      await listCourses(params);

      // Non-admin should still see only non-deleted courses
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false })
      );
    });

    it("should handle onlyDeleted for non-admin user", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        onlyDeleted: true,
        userRole: Role.STUDENT,
      };

      await listCourses(params);

      // Non-admin should see normal courses instead of deleted ones
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false })
      );
    });

    it("should filter by isPublished status", async () => {
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
        isPublished: true,
        userRole: Role.ADMIN,
      };

      await listCourses(params);

      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: true })
      );
    });

    it("should filter by course status", async () => {
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
        status: CourseStatus.ONGOING,
        userRole: Role.ADMIN,
      };

      await listCourses(params);

      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: CourseStatus.ONGOING })
      );
    });

    it("should filter by teacherId", async () => {
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
        teacherId: teacherUser._id.toString(),
        userRole: Role.ADMIN,
      };

      await listCourses(params);

      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ teacherIds: teacherUser._id.toString() })
      );
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

    it("should throw error when not all teachers found", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      const anotherTeacherId = new mongoose.Types.ObjectId().toString();
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]); // Only 1 teacher found, but 2 requested

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString(), anotherTeacherId],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("One or more teachers not found");
    });

    it("should throw error when teacher does not have required specialization", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...teacherUser,
        specialistIds: [], // Teacher has no specialist
      }]);

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
      ).rejects.toThrow("do not have the required specialization");
    });

    it("should allow admin to bypass specialization check", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...adminUser,
        role: Role.ADMIN,
        specialistIds: [], // Admin has no specialist but should bypass check
      }]);
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
        teacherIds: [adminUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      const result = await createCourse(courseData, adminUser._id.toString());
      expect(result).toBeDefined();
    });

    it("should allow teacher with matching specialization", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...teacherUser,
        specialistIds: [specialistId], // Teacher HAS matching specialist
      }]);
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
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
      };

      const result = await createCourse(courseData, adminUser._id.toString());
      expect(result).toBeDefined();
    });

    it("should validate capacity within allowed range", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: false,
        enrollRequiresApproval: false,
        capacity: 501, // Over limit
      };

      await expect(
        createCourse(courseData, adminUser._id.toString())
      ).rejects.toThrow("Capacity must be between 1 and 500 students");
    });

    it("should auto change status to ONGOING when admin publishes", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue({
        ...course,
        status: CourseStatus.ONGOING,
        isPublished: true,
      });

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...course,
          status: CourseStatus.ONGOING,
          isPublished: true,
        }),
      };
      (CourseModel.findById as jest.Mock).mockReturnValue(mockQuery);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        teacherIds: [teacherUser._id.toString()],
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-01"),
        status: CourseStatus.DRAFT,
        isPublished: true, // Admin publishes
        enrollRequiresApproval: false,
      };

      const result = await createCourse(courseData, adminUser._id.toString());

      // Verify status was changed to ONGOING
      expect(CourseModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: CourseStatus.ONGOING })
      );
    });

    it("should upload logo when logoFile is provided", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...course,
          logo: "http://test.com/logo.png",
        }),
      };
      (CourseModel.findById as jest.Mock).mockReturnValue(mockQuery);

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

      const mockLogoFile = {
        originalname: "logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const result = await createCourse(courseData, adminUser._id.toString(), mockLogoFile);

      expect(uploadFile).toHaveBeenCalled();
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          logo: "http://test.com/logo.png",
          key: "test-key",
        })
      );
    });

    it("should rollback course creation if logo upload fails", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);
      (uploadFile as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(course);

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

      const mockLogoFile = {
        originalname: "logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      await expect(
        createCourse(courseData, adminUser._id.toString(), mockLogoFile)
      ).rejects.toThrow();

      // Verify rollback - course should be deleted
      expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id);
    });

    it("should handle cleanup error when logo upload fails after successful upload", async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);
      
      // uploadFile succeeds first time
      (uploadFile as jest.Mock).mockResolvedValueOnce({ publicUrl: "http://test.com/logo.png", key: "test-key" });
      
      // But findByIdAndUpdate fails (e.g. DB error)
      (CourseModel.findByIdAndUpdate as jest.Mock).mockRejectedValueOnce(new Error("DB update failed"));
      
      // Cleanup also fails
      (removeFile as jest.Mock).mockRejectedValueOnce(new Error("Cleanup failed"));
      
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(course);

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

      const mockLogoFile = {
        originalname: "logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      await expect(
        createCourse(courseData, adminUser._id.toString(), mockLogoFile)
      ).rejects.toThrow();

      // Should still rollback course even if cleanup fails
      expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id);
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

    it("should throw error when changing start date for already started course", async () => {
      const startedCourse = {
        ...course,
        startDate: new Date("2020-01-01"), // Already started
        endDate: new Date("2027-01-01"), // Keep endDate > new startDate to avoid other validation
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(startedCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);

      const updateData = { 
        startDate: new Date("2026-01-01"),
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString())
      ).rejects.toThrow("Cannot change start date of a course that has already started");
    });

    it("should throw error when new start date is not in the future", async () => {
      const futureCourse = {
        ...course,
        startDate: new Date("2026-01-01"), // In the future
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(futureCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);

      const updateData = { 
        startDate: new Date("2020-01-01"), // In the past
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString())
      ).rejects.toThrow("New start date must be in the future");
    });

    it("should throw error when teacher does not have required specialization on update", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...teacherUser,
        specialistIds: [], // Teacher has no specialist
      }]);

      const updateData = { 
        teacherIds: [teacherUser._id.toString()],
        startDate: undefined,
        endDate: undefined,
      };

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString())
      ).rejects.toThrow("do not have the required specialization");
    });

    it("should allow admin to bypass specialization check on update", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...adminUser,
        role: Role.ADMIN,
        specialistIds: [], // Admin has no specialist but should bypass check
      }]);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        teacherIds: [adminUser._id.toString()],
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
    });

    it("should allow teacher with matching specialization on update", async () => {
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...teacherUser,
        specialistIds: [specialistId], // Teacher HAS matching specialist
      }]);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        teacherIds: [teacherUser._id.toString()],
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
    });

    it("should update both startDate and endDate successfully", async () => {
      const futureCourse = {
        ...course,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-01"),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...futureCourse,
          startDate: new Date("2026-02-01"),
          endDate: new Date("2026-08-01"),
        }),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(futureCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-08-01"),
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("should auto change status to ONGOING when admin publishes a DRAFT course", async () => {
      const draftCourse = {
        ...course,
        status: CourseStatus.DRAFT,
        startDate: new Date("2026-01-01"),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...draftCourse,
          isPublished: true,
          status: CourseStatus.ONGOING,
        }),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(draftCourse);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        isPublished: true,
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        course._id.toString(),
        expect.objectContaining({
          $set: expect.objectContaining({ status: CourseStatus.ONGOING })
        }),
        expect.any(Object)
      );
    });

    it("should upload new logo when logoFile is provided on update", async () => {
      const courseWithLogo = {
        ...course,
        logo: "http://test.com/old-logo.png",
        key: "old-logo-key",
        startDate: new Date("2026-01-01"),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...courseWithLogo,
          logo: "http://test.com/logo.png",
          key: "test-key",
        }),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(courseWithLogo);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        title: "Updated Title",
        startDate: undefined,
        endDate: undefined,
      };

      const mockLogoFile = {
        originalname: "new-logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString(),
        mockLogoFile
      );

      expect(uploadFile).toHaveBeenCalled();
      expect(removeFile).toHaveBeenCalledWith("old-logo-key");
    });

    it("should continue update even if old logo deletion fails", async () => {
      const courseWithLogo = {
        ...course,
        logo: "http://test.com/old-logo.png",
        key: "old-logo-key",
        startDate: new Date("2026-01-01"),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...courseWithLogo,
          logo: "http://test.com/logo.png",
          key: "test-key",
        }),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(courseWithLogo);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);
      
      // Old logo deletion fails, but should continue
      (removeFile as jest.Mock).mockRejectedValueOnce(new Error("Old logo deletion failed"));

      const updateData = { 
        title: "Updated Title",
        startDate: undefined,
        endDate: undefined,
      };

      const mockLogoFile = {
        originalname: "new-logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString(),
        mockLogoFile
      );

      // Should still succeed despite old logo deletion failure
      expect(result).toBeDefined();
      expect(uploadFile).toHaveBeenCalled();
    });

    it("should remove logo when logo is set to null", async () => {
      const courseWithLogo = {
        ...course,
        logo: "http://test.com/logo.png",
        key: "logo-key",
        startDate: new Date("2026-01-01"),
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          ...course,
          logo: undefined,
          key: undefined,
        }),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(courseWithLogo);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const updateData = { 
        logo: null,
        startDate: undefined,
        endDate: undefined,
      };

      const result = await updateCourse(
        course._id.toString(),
        updateData,
        adminUser._id.toString()
      );

      expect(removeFile).toHaveBeenCalledWith("logo-key");
      expect(CourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        course._id.toString(),
        expect.objectContaining({
          $unset: expect.objectContaining({ logo: 1, key: 1 })
        }),
        expect.any(Object)
      );
    });

    it("should rollback new logo if database update fails", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };

      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Database update failed");
      });

      const updateData = { 
        title: "Updated Title",
        startDate: undefined,
        endDate: undefined,
      };

      const mockLogoFile = {
        originalname: "logo.png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      await expect(
        updateCourse(course._id.toString(), updateData, adminUser._id.toString(), mockLogoFile)
      ).rejects.toThrow();

      // Should cleanup the newly uploaded logo
      expect(removeFile).toHaveBeenCalledWith("test-key");
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

    it("should delete logo file when permanently deleting course", async () => {
      const deletedCourseWithLogo = {
        ...course,
        isDeleted: true,
        logo: "http://test.com/logo.png",
        key: "logo-key",
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourseWithLogo);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedCourseWithLogo);

      const result = await permanentDeleteCourse(
        course._id.toString(),
        adminUser._id.toString()
      );

      expect(result).toBeDefined();
      expect(removeFile).toHaveBeenCalledWith("logo-key");
      expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id.toString());
    });

    it("should continue deletion even if logo file deletion fails", async () => {
      const deletedCourseWithLogo = {
        ...course,
        isDeleted: true,
        logo: "http://test.com/logo.png",
        key: "logo-key",
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(deletedCourseWithLogo);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (EnrollmentModel.countDocuments as jest.Mock).mockResolvedValue(0);
      (removeFile as jest.Mock).mockRejectedValueOnce(new Error("File deletion failed"));
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedCourseWithLogo);

      const result = await permanentDeleteCourse(
        course._id.toString(),
        adminUser._id.toString()
      );

      // Should still complete successfully despite logo deletion failure
      expect(result).toBeDefined();
      expect(result.message).toBe("Course permanently deleted successfully");
      expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id.toString());
    });
  });
});

