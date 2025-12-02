// Course Service Unit Tests
import mongoose from "mongoose";
import { Role, UserStatus } from "@/types";
import { CourseStatus } from "@/types/course.type";
import { EnrollmentStatus } from "@/types/enrollment.type";

// Mock all models before importing services
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/subject.model");
jest.mock("@/models/semester.model");
jest.mock("@/models/notification.model");
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
import SemesterModel from "@/models/semester.model";
import NotificationModel from "@/models/notification.model";
import appAssert from "@/utils/appAssert";
import { uploadFile, removeFile } from "@/utils/uploadFile";

// Import services
import {
  listCourses,
  getCourseById,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
  getMyCourses,
  getQuizzes,
  completeCourse,
  getCourseStatistics,
  ListCoursesParams,
} from "@/services/course.service";
import { GetQuizzes } from "@/validators/course.schemas";

// Mock additional models for new tests
jest.mock("@/models/quiz.model");
jest.mock("@/models/lesson.model");
jest.mock("@/models/assignment.model");
import QuizModel from "@/models/quiz.model";
import LessonModel from "@/models/lesson.model";
import AssignmentModel from "@/models/assignment.model";

describe("📚 Course Service Unit Tests", () => {
  let adminUser: any;
  let teacherUser: any;
  let studentUser: any;
  let subject: any;
  let course: any;
  let semester: any;

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

    semester = {
      _id: new mongoose.Types.ObjectId(),
      name: "Fall 2025",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-06-01"),
    };

    course = {
      _id: new mongoose.Types.ObjectId(),
      title: "Introduction to Programming",
      description: "Learn programming basics",
      subjectId: subject._id,
      semesterId: semester._id,
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

    // Mock SemesterModel.find for expired semester check (returns empty array by default)
    const mockSemesterQuery = {
      select: jest.fn().mockResolvedValue([]),
    };
    (SemesterModel.find as jest.Mock).mockReturnValue(mockSemesterQuery);

    // Mock SemesterModel.findById for semester validation
    (SemesterModel.findById as jest.Mock).mockResolvedValue(semester);

    // Mock NotificationModel for notification creation
    (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

    // Mock UserModel.find().select() for notification helper
    const mockUserFindSelect = {
      select: jest.fn().mockResolvedValue([adminUser]),
    };
    (UserModel.find as jest.Mock).mockReturnValue(mockUserFindSelect);

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

    // ====================================
    // isTeacherOfCourse FIELD TESTS
    // ====================================
    it("should add isTeacherOfCourse=true when userId matches course teacher", async () => {
      const courseWithTeacher = {
        ...course,
        teacherIds: [{ _id: teacherUser._id, username: "teacher_test" }],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([courseWithTeacher]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.TEACHER,
        userId: teacherUser._id, // Teacher viewing courses
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].isTeacherOfCourse).toBe(true);
    });

    it("should add isTeacherOfCourse=false when userId does not match course teacher", async () => {
      const anotherTeacherId = new mongoose.Types.ObjectId();
      const courseWithDifferentTeacher = {
        ...course,
        teacherIds: [{ _id: anotherTeacherId, username: "another_teacher" }],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([courseWithDifferentTeacher]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.TEACHER,
        userId: teacherUser._id, // Different teacher
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].isTeacherOfCourse).toBe(false);
    });

    it("should add isTeacherOfCourse=false when userId is not provided", async () => {
      const courseWithTeacher = {
        ...course,
        teacherIds: [{ _id: teacherUser._id, username: "teacher_test" }],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([courseWithTeacher]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.STUDENT,
        // userId not provided
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].isTeacherOfCourse).toBe(false);
    });

    it("should handle multiple courses with mixed isTeacherOfCourse values", async () => {
      const course1 = {
        ...course,
        _id: new mongoose.Types.ObjectId(),
        title: "Course 1",
        teacherIds: [{ _id: teacherUser._id, username: "teacher_test" }], // User is teacher
      };

      const course2 = {
        ...course,
        _id: new mongoose.Types.ObjectId(),
        title: "Course 2",
        teacherIds: [{ _id: new mongoose.Types.ObjectId(), username: "other_teacher" }], // User is not teacher
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([course1, course2]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.TEACHER,
        userId: teacherUser._id,
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(2);
      expect(result.courses[0].isTeacherOfCourse).toBe(true);  // Course 1
      expect(result.courses[1].isTeacherOfCourse).toBe(false); // Course 2
    });

    it("should handle teacherIds as ObjectId strings correctly", async () => {
      const courseWithStringTeacherId = {
        ...course,
        teacherIds: [teacherUser._id.toString()], // Plain ObjectId string
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([courseWithStringTeacherId]),
      };
      (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
      (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const params: ListCoursesParams = {
        page: 1,
        limit: 10,
        userRole: Role.TEACHER,
        userId: teacherUser._id,
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].isTeacherOfCourse).toBe(true);
    });
  });

  // ====================================
  // BRANCH COVERAGE TESTS - Added for 85% target
  // ====================================
  describe("Branch Coverage Improvements", () => {
    it("should not allow non-admin to view recycle bin (onlyDeleted)", async () => {
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
        userRole: Role.TEACHER,
        onlyDeleted: true, // Non-admin tries to view recycle bin
      };

      const result = await listCourses(params);

      // Should show normal courses instead (isDeleted: false)
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
        })
      );
    });

    it("should not allow non-admin to include deleted courses", async () => {
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
        includeDeleted: true, // Non-admin tries to include deleted
      };

      const result = await listCourses(params);

      // Should only show non-deleted courses
      expect(CourseModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
        })
      );
    });

    it("should work without search parameter", async () => {
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
        search: undefined, // Test undefined search
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      // Filter should not include $or for search
      const filterCall = (CourseModel.find as jest.Mock).mock.calls[0][0];
      expect(filterCall.$or).toBeUndefined();
    });

    it("should work without subjectId parameter", async () => {
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
        subjectId: undefined, // Test undefined subjectId
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      const filterCall = (CourseModel.find as jest.Mock).mock.calls[0][0];
      expect(filterCall.subjectId).toBeUndefined();
    });

    it("should work without teacherId parameter", async () => {
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
        teacherId: undefined, // Test undefined teacherId
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      const filterCall = (CourseModel.find as jest.Mock).mock.calls[0][0];
      expect(filterCall.teachers).toBeUndefined();
    });

    it("should work without status parameter for admin", async () => {
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
        status: undefined, // Test undefined status for admin
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      // Admin can see all statuses when not specified
      const filterCall = (CourseModel.find as jest.Mock).mock.calls[0][0];
      // Status should not be in filter when undefined
      expect(filterCall.status).toBeUndefined();
    });

    it("should work without isPublished parameter for admin", async () => {
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
        isPublished: undefined, // Test undefined isPublished for admin
      };

      const result = await listCourses(params);

      expect(result.courses).toHaveLength(1);
      // Admin can see all published states when not specified
      const filterCall = (CourseModel.find as jest.Mock).mock.calls[0][0];
      expect(filterCall.isPublished).toBeUndefined();
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
      expect(result.isTeacherOfCourse).toBe(false); // No userId provided
      expect(CourseModel.findOne).toHaveBeenCalledWith({
        _id: course._id.toString(),
        isDeleted: false,
      });
    });

    it("should return isTeacherOfCourse=true when userId matches course teacher", async () => {
      const courseWithTeacher = {
        ...course,
        teacherIds: [{ _id: teacherUser._id, username: "teacher_test" }],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(courseWithTeacher),
      };
      (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await getCourseById(course._id.toString(), teacherUser._id);

      expect(result).toBeDefined();
      expect(result.isTeacherOfCourse).toBe(true);
    });

    it("should return isTeacherOfCourse=false when userId does not match course teacher", async () => {
      const anotherTeacherId = new mongoose.Types.ObjectId();
      const courseWithDifferentTeacher = {
        ...course,
        teacherIds: [{ _id: anotherTeacherId, username: "other_teacher" }],
      };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(courseWithDifferentTeacher),
      };
      (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await getCourseById(course._id.toString(), teacherUser._id);

      expect(result).toBeDefined();
      expect(result.isTeacherOfCourse).toBe(false);
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue({ ...subject, isActive: false });

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([
        { ...teacherUser, status: UserStatus.INACTIVE },
      ]);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      const anotherTeacherId = new mongoose.Types.ObjectId().toString();
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]); // Only 1 teacher found, but 2 requested

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      const specialistId = new mongoose.Types.ObjectId();
      const subjectWithSpecialist = {
        ...subject,
        specialistIds: [specialistId],
      };

      (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpecialist);
      // Admin must also have matching specialization (bypass was removed)
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...adminUser,
        role: Role.ADMIN,
        specialistIds: [specialistId], // Admin HAS matching specialist
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
      (SubjectModel.findById as jest.Mock).mockResolvedValue(subject);
      (UserModel.find as jest.Mock).mockResolvedValue([teacherUser]);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.create as jest.Mock).mockResolvedValue(course);
      (uploadFile as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));
      (CourseModel.findByIdAndDelete as jest.Mock).mockResolvedValue(course);

      const courseData = {
        title: "New Course",
        subjectId: subject._id.toString(),
        semesterId: semester._id.toString(),
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
      // Mock findOne to return null (no duplicate title)
      (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
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
        semesterId: semester._id.toString(),
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
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ ...course, title: "Updated Title" }),
      };
      // First findOne returns the course (for permission check)
      // Second findOne returns null (for duplicate title check)
      // Third findOne returns null (for duplicate slug check)
      (CourseModel.findOne as jest.Mock)
        .mockResolvedValueOnce(course)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockPopulateChain);

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
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockPopulateChain);

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
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(course),
      };
      (CourseModel.findOne as jest.Mock).mockResolvedValue(course);
      (UserModel.findById as jest.Mock).mockResolvedValue(teacherUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockPopulateChain);

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
      // Admin must also have matching specialization (bypass was removed)
      (UserModel.find as jest.Mock).mockResolvedValue([{
        ...adminUser,
        role: Role.ADMIN,
        specialistIds: [specialistId], // Admin HAS matching specialist
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
      // Reset mocks
      jest.clearAllMocks();
      (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
        if (!condition) throw new Error(message);
      });

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
      // Reset uploadFile mock to succeed
      (uploadFile as jest.Mock).mockResolvedValue({ publicUrl: "http://test.com/logo.png", key: "test-key" });
      (removeFile as jest.Mock).mockResolvedValue(undefined);

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

      // First findOne returns the course, second returns null (no duplicate title), third returns null (no duplicate slug)
      (CourseModel.findOne as jest.Mock)
        .mockResolvedValueOnce(courseWithLogo)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      // Reset uploadFile mock to succeed
      (uploadFile as jest.Mock).mockResolvedValue({ publicUrl: "http://test.com/logo.png", key: "test-key" });

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

      // First findOne returns the course, second returns null (no duplicate title), third returns null (no duplicate slug)
      (CourseModel.findOne as jest.Mock)
        .mockResolvedValueOnce(courseWithLogo)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      // Old logo deletion fails, but should continue (this happens AFTER successful DB update)
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
      // Reset removeFile to succeed for this test
      (removeFile as jest.Mock).mockResolvedValue(undefined);

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
      // First findOne returns the course, second returns null (no duplicate title)
      (CourseModel.findOne as jest.Mock)
        .mockResolvedValueOnce(course)
        .mockResolvedValueOnce(null);
      (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);

      // Create a mock that throws on first call
      const mockPopulateChain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error("Database update failed")),
      };
      (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockPopulateChain);

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
      (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...course, isDeleted: true });

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

  // ====================================
  // GET QUIZZES TESTS
  // ====================================
  describe("getQuizzes", () => {
    it("should get quizzes for a course with pagination", async () => {
      const mockQuiz = {
        _id: new mongoose.Types.ObjectId(),
        title: "Quiz 1",
        courseId: course._id,
        questions: [
          { _id: new mongoose.Types.ObjectId(), question: "Q1" },
          { _id: new mongoose.Types.ObjectId(), question: "Q2" },
        ],
      };

      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        countDocuments: jest.fn().mockResolvedValue(1),
        lean: jest.fn().mockResolvedValue([mockQuiz]),
      };
      (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);

      const params: GetQuizzes = {
        courseId: course._id.toString(),
        page: 1,
        limit: 10,
        sortOrder: 'desc' as const,
      };

      const result = await getQuizzes(params, Role.ADMIN);

      expect(result).toBeDefined();
      expect(result.quizzes).toHaveLength(1);
      expect(CourseModel.findById).toHaveBeenCalledWith(course._id.toString());
    });

    it("should throw error when course not found", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(null);

      const params: GetQuizzes = {
        courseId: new mongoose.Types.ObjectId().toString(),
        page: 1,
        limit: 10,
        sortOrder: 'desc' as const,
      };

      await expect(
        getQuizzes(params, Role.STUDENT)
      ).rejects.toThrow("Course not found");
    });

    it("should filter by isPublished for students", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        countDocuments: jest.fn().mockResolvedValue(0),
        lean: jest.fn().mockResolvedValue([]),
      };
      (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);

      const params: GetQuizzes = {
        courseId: course._id.toString(),
        page: 1,
        limit: 10,
        sortOrder: 'desc' as const,
      };

      await getQuizzes(params, Role.STUDENT);

      // Students should only see published and non-deleted quizzes
      expect(QuizModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: course._id.toString(),
          isPublished: true,
          deletedAt: null,
        })
      );
    });

    it("should handle empty quiz list", async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValue(course);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        countDocuments: jest.fn().mockResolvedValue(0),
        lean: jest.fn().mockResolvedValue([]),
      };
      (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
      (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

      const params: GetQuizzes = {
        courseId: course._id.toString(),
        page: 1,
        limit: 10,
        sortOrder: 'desc' as const,
      };

      const result = await getQuizzes(params, Role.ADMIN);

      expect(result.quizzes).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ====================================
  // COMPLETE COURSE TESTS
  // ====================================
  describe("completeCourse", () => {
    it("should throw error when course not found", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      };
      (CourseModel.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(
        completeCourse(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow("Course not found");
    });

    it("should complete course and update student enrollments", async () => {
      const mockCourse = {
        ...course,
        _id: course._id,
        status: CourseStatus.ONGOING,
      };

      (CourseModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      const mockStats = [
        {
          _id: new mongoose.Types.ObjectId(),
          studentId: studentUser._id,
          student: { username: "student1" },
          attendance: { total: 10, present: 8, absent: 2 },
          quiz: { attempts: 3, totalScore: 24, details: [] },
          assignment: { total: 5, submitted: 4, totalGrade: 85, details: [] },
          lesson: { total: 12, completed: 10 },
          progress: {
            attendance: 80,
            quiz: 80,
            assignment: 85,
            lesson: 83.33,
          },
          finalGrade: 82,
          status: EnrollmentStatus.APPROVED, // Must be APPROVED to trigger updateOne
        },
      ];

      (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue(mockStats);
      (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
      (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockCourse,
        status: CourseStatus.COMPLETED,
      });

      const result = await completeCourse(course._id.toString());

      expect(result).toBeDefined();
      expect(result.course).toHaveProperty('_id');
      expect(EnrollmentModel.aggregate).toHaveBeenCalled();
      // bulkWrite is called once with array of operations
      expect(EnrollmentModel.bulkWrite).toHaveBeenCalledTimes(1);
    });

    it("should handle course with no enrolled students", async () => {
      const mockCourse = {
        ...course,
        status: CourseStatus.ONGOING,
      };

      (CourseModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCourse),
      });

      (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue([]);
      (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockCourse,
        status: CourseStatus.COMPLETED,
      });

      const result = await completeCourse(course._id.toString());

      expect(result).toBeDefined();
      expect(result.course).toHaveProperty('_id');
      expect(EnrollmentModel.updateOne).not.toHaveBeenCalled();
    });
  });


  // ====================================
  // ADDITIONAL BRANCH COVERAGE TESTS
  // ====================================
  describe("Branch Coverage Improvements", () => {
    describe("getCourseStatistics", () => {
      it("should deny access if teacher is not assigned to the course", async () => {
        const otherTeacherId = new mongoose.Types.ObjectId();
        const mockCourse = {
          _id: course._id,
          teacherIds: [otherTeacherId], // Different teacher
        };

        (CourseModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCourse),
        });

        await expect(
          getCourseStatistics(course._id.toString(), teacherUser._id, Role.TEACHER)
        ).rejects.toThrow("You don't have permission to view statistics for this course");
      });

      it("should return default statistics if course has no statistics", async () => {
        const mockCourse = {
          _id: course._id,
          title: "Test Course",
          teacherIds: [teacherUser._id],
          statistics: null, // No statistics
        };

        (CourseModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCourse),
        });

        const result = await getCourseStatistics(
          course._id.toString(),
          teacherUser._id,
          Role.TEACHER
        );

        expect(result.statistics).toBeNull();
        expect(result.message).toBeDefined();
      });

      it("should handle division by zero in progress calculation", async () => {
        const mockCourse = {
          _id: course._id,
          teacherIds: [teacherUser._id],
          statistics: { totalLessons: 0 }, // 0 lessons
        };

        (CourseModel.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCourse),
        });

        const mockEnrollment = {
          _id: new mongoose.Types.ObjectId(),
          studentId: {
            _id: new mongoose.Types.ObjectId(),
            username: "student",
            fullname: "Student Name",
          },
          progress: {
            totalLessons: 0, // 0 lessons
            completedLessons: 0,
          },
          status: EnrollmentStatus.APPROVED,
        };

        (EnrollmentModel.find as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([mockEnrollment]),
        });

        const result = await getCourseStatistics(
          course._id.toString(),
          teacherUser._id,
          Role.TEACHER
        );

        expect(result.students[0].progress.lessons.percent).toBe(0); // Should be 0, not NaN
      });
    });

    describe("getQuizzes Filters", () => {
      it("should filter quizzes by isPublished", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
        (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

        await getQuizzes({
          courseId: course._id.toString(),
          isPublished: true,
          page: 1,
          limit: 10,
          sortOrder: 'desc'
        }, Role.TEACHER);

        expect(QuizModel.find).toHaveBeenCalledWith(
          expect.objectContaining({ isPublished: true })
        );
      });

      it("should remove snapshotQuestions for students", async () => {
        const mockQuiz = {
          _id: new mongoose.Types.ObjectId(),
          title: "Quiz 1",
          snapshotQuestions: ["question1"],
        };

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([mockQuiz]),
        };
        (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
        (QuizModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const result = await getQuizzes(
          {
            courseId: course._id.toString(),
            page: 1,
            limit: 10,
            sortOrder: 'desc'
          },
          Role.STUDENT // Student role
        );

        expect(result.quizzes[0].snapshotQuestions).toEqual([]);
      });
    });

    describe("More Branch Coverage", () => {
      describe("getQuizzes Filters Extended", () => {
        it("should filter by isCompleted=true", async () => {
          const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          };
          (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
          (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

          await getQuizzes({
            courseId: course._id.toString(),
            isCompleted: true,
            page: 1, limit: 10, sortOrder: 'desc'
          }, Role.TEACHER);

          expect(QuizModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ endTime: { $gte: expect.any(Date) } })
          );
        });

        it("should filter by isCompleted=false", async () => {
          const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          };
          (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
          (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

          await getQuizzes({
            courseId: course._id.toString(),
            isCompleted: false,
            page: 1, limit: 10, sortOrder: 'desc'
          }, Role.TEACHER);

          expect(QuizModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ endTime: { $lt: expect.any(Date) } })
          );
        });

        it("should filter by isDeleted=true", async () => {
          const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          };
          (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
          (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

          await getQuizzes({
            courseId: course._id.toString(),
            isDeleted: true,
            page: 1, limit: 10, sortOrder: 'desc'
          }, Role.TEACHER);

          expect(QuizModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ deletedAt: { $ne: null } })
          );
        });

        it("should filter by isDeleted=false", async () => {
          const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          };
          (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
          (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

          await getQuizzes({
            courseId: course._id.toString(),
            isDeleted: false,
            page: 1, limit: 10, sortOrder: 'desc'
          }, Role.TEACHER);

          expect(QuizModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ deletedAt: null })
          );
        });

        it("should filter by search term", async () => {
          const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          };
          (QuizModel.find as jest.Mock).mockReturnValue(mockQuery);
          (QuizModel.countDocuments as jest.Mock).mockResolvedValue(0);

          await getQuizzes({
            courseId: course._id.toString(),
            search: "test quiz",
            page: 1, limit: 10, sortOrder: 'desc'
          }, Role.TEACHER);

          expect(QuizModel.find).toHaveBeenCalledWith(
            expect.objectContaining({
              title: { $regex: "test quiz", $options: 'i' },
              description: { $regex: "test quiz", $options: 'i' }
            })
          );
        });
      });

      describe("completeCourse Logic", () => {
        it("should mark student as DROPPED if absent > 20%", async () => {
          const mockCourse = { ...course, status: CourseStatus.ONGOING };
          (CourseModel.findById as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockCourse),
          });

          const mockStats = [{
            _id: new mongoose.Types.ObjectId(),
            studentId: studentUser._id,
            progress: { totalAttendances: 10, completedAttendances: 7 }, // 30% absent
            finalGrade: 8,
            status: EnrollmentStatus.APPROVED,
            lesson: { total: 10, completed: 5 },
            quiz: { total: 5, completed: 3, totalScore: 24, details: [] },
            assignment: { total: 5, submitted: 3, totalGrade: 24, details: [] },
            attendance: { total: 10, present: 7 }
          }];
          (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue(mockStats);
          (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
          (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);

          await completeCourse(course._id.toString());

          const bulkOps = (EnrollmentModel.bulkWrite as jest.Mock).mock.calls[0][0];
          expect(bulkOps[0].updateOne.update.$set.status).toBe(EnrollmentStatus.DROPPED);
          expect(bulkOps[0].updateOne.update.$set.droppedAt).toBeDefined();
        });

        it("should mark student as COMPLETED if passing", async () => {
          const mockCourse = { ...course, status: CourseStatus.ONGOING };
          (CourseModel.findById as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockCourse),
          });

          const mockStats = [{
            _id: new mongoose.Types.ObjectId(),
            studentId: studentUser._id,
            progress: { totalAttendances: 10, completedAttendances: 10 }, // 0% absent
            finalGrade: 8,
            status: EnrollmentStatus.APPROVED,
            lesson: { total: 10, completed: 10 },
            quiz: { total: 5, completed: 5, totalScore: 40, details: [] },
            assignment: { total: 5, submitted: 5, totalGrade: 40, details: [] },
            attendance: { total: 10, present: 10 }
          }];
          (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue(mockStats);
          (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
          (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);

          await completeCourse(course._id.toString());

          const bulkOps = (EnrollmentModel.bulkWrite as jest.Mock).mock.calls[0][0];
          expect(bulkOps[0].updateOne.update.$set.status).toBe(EnrollmentStatus.APPROVED);
          expect(bulkOps[0].updateOne.update.$set.completedAt).toBeDefined();
        });
      });

      describe("getCourseStatistics Existing Stats", () => {
        it("should use existing statistics counts if available", async () => {
          const mockCourse = {
            _id: course._id,
            teacherIds: [teacherUser._id],
            statistics: {
              totalLessons: 5,
              totalQuizzes: 3,
              totalAssignments: 2,
              totalAttendances: 10
            },
          };

          (CourseModel.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockCourse),
          });

          (EnrollmentModel.find as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
          });

          await getCourseStatistics(course._id.toString(), teacherUser._id, Role.TEACHER);

          // Should NOT call countDocuments if stats exist
          expect(LessonModel.countDocuments).not.toHaveBeenCalled();
          expect(QuizModel.countDocuments).not.toHaveBeenCalled();
          expect(AssignmentModel.countDocuments).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("Coverage Gap Filling", () => {
    describe("getCourseBySlug", () => {
      it("should return course by slug", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(course),
        };
        (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        const result = await getCourseBySlug("test-course");
        expect(result).toEqual(course);
        expect(CourseModel.findOne).toHaveBeenCalledWith(
          expect.objectContaining({ slug: { $regex: "test-course", $options: "i" } })
        );
      });

      it("should throw error if slug is missing", async () => {
        await expect(getCourseBySlug("")).rejects.toThrow();
      });

      it("should throw error if course not found", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        await expect(getCourseBySlug("non-existent")).rejects.toThrow("Course not found");
      });
    });

    describe("getMyCourses", () => {
      it("should return all courses for ADMIN", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        const result = await getMyCourses({ userId: adminUser._id.toString(), userRole: Role.ADMIN, params });

        expect(result.courses).toHaveLength(1);
        // Admin should not have specific ID filters
        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter._id).toBeUndefined();
        expect(filter.$or).toBeUndefined();
      });

      it("should return enrolled courses for STUDENT", async () => {
        const mockEnrollments = [{ courseId: course._id }];
        (EnrollmentModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockEnrollments),
        });

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        await getMyCourses({ userId: studentUser._id.toString(), userRole: Role.STUDENT, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter._id).toEqual({ $in: [course._id] });
      });

      it("should return created/assigned courses for TEACHER", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        await getMyCourses({ userId: teacherUser._id.toString(), userRole: Role.TEACHER, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.$or).toEqual([{ createdBy: teacherUser._id.toString() }, { teacherIds: teacherUser._id.toString() }]);
      });

      it("should filter by search term", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params = { page: 1, limit: 10, search: "test" };
        await getMyCourses({ userId: adminUser._id.toString(), userRole: Role.ADMIN, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.$and).toBeDefined();
        expect(filter.$and[0].$or).toBeDefined();
      });

      it("should filter by slug", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params = { page: 1, limit: 10, slug: "slug" };
        await getMyCourses({ userId: adminUser._id.toString(), userRole: Role.ADMIN, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.slug).toBeDefined();
      });
    });

    describe("listCourses Edge Cases", () => {
      it("should hide expired semesters for non-admin", async () => {
        const expiredSemester = { _id: new mongoose.Types.ObjectId() };
        (SemesterModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue([expiredSemester]),
        });

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params: ListCoursesParams = { page: 1, limit: 10, userRole: Role.STUDENT };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.semesterId).toEqual({ $nin: [expiredSemester._id] });
      });

      it("should filter by date range", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const fromDate = new Date("2024-01-01");
        const toDate = new Date("2024-12-31");
        const params: ListCoursesParams = {
          page: 1, limit: 10, userRole: Role.ADMIN,
          from: fromDate,
          to: toDate
        };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
      });
    });

    describe("completeCourse Fallback Logic", () => {
      it("should calculate missing counts", async () => {
        const mockCourse = { ...course, status: CourseStatus.ONGOING, statistics: {} }; // No stats
        (CourseModel.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCourse),
        });

        (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue([]); // No students
        (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
        (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);

        // Mock counts
        (LessonModel.countDocuments as jest.Mock).mockResolvedValue(5);
        (QuizModel.countDocuments as jest.Mock).mockResolvedValue(3);
        (AssignmentModel.countDocuments as jest.Mock).mockResolvedValue(2);

        await completeCourse(course._id.toString());

        expect(LessonModel.countDocuments).toHaveBeenCalled();
        expect(QuizModel.countDocuments).toHaveBeenCalled();
        expect(AssignmentModel.countDocuments).toHaveBeenCalled();
      });
    });
  });

  describe("Coverage Gap Filling", () => {
    describe("getCourseBySlug", () => {
      it("should return course by slug", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(course),
        };
        (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        const result = await getCourseBySlug("test-course");
        expect(result).toEqual(course);
        expect(CourseModel.findOne).toHaveBeenCalledWith(
          expect.objectContaining({ slug: { $regex: "test-course", $options: "i" } })
        );
      });

      it("should throw error if slug is missing", async () => {
        await expect(getCourseBySlug("")).rejects.toThrow();
      });

      it("should throw error if course not found", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        (CourseModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        await expect(getCourseBySlug("non-existent")).rejects.toThrow("Course not found");
      });
    });

    describe("getMyCourses", () => {
      it("should return all courses for ADMIN", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        const result = await getMyCourses({ userId: adminUser._id, userRole: Role.ADMIN, params });

        expect(result.courses).toHaveLength(1);
        // Admin should not have specific ID filters
        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter._id).toBeUndefined();
        expect(filter.$or).toBeUndefined();
      });

      it("should return enrolled courses for STUDENT", async () => {
        const mockEnrollments = [{ courseId: course._id }];
        (EnrollmentModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockEnrollments),
        });

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        await getMyCourses({ userId: studentUser._id, userRole: Role.STUDENT, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter._id).toEqual({ $in: [course._id] });
      });

      it("should return created/assigned courses for TEACHER", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([course]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params = { page: 1, limit: 10 };
        await getMyCourses({ userId: teacherUser._id, userRole: Role.TEACHER, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.$or).toEqual([{ createdBy: teacherUser._id }, { teacherIds: teacherUser._id }]);
      });

      it("should filter by search term", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params = { page: 1, limit: 10, search: "test" };
        await getMyCourses({ userId: adminUser._id, userRole: Role.ADMIN, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.$and).toBeDefined();
        expect(filter.$and[0].$or).toBeDefined();
      });

      it("should filter by slug", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params = { page: 1, limit: 10, slug: "slug" };
        await getMyCourses({ userId: adminUser._id, userRole: Role.ADMIN, params });

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.slug).toBeDefined();
      });
    });

    describe("listCourses Edge Cases", () => {
      it("should hide expired semesters for non-admin", async () => {
        const expiredSemester = { _id: new mongoose.Types.ObjectId() };
        (SemesterModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue([expiredSemester]),
        });

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const params: ListCoursesParams = { page: 1, limit: 10, userRole: Role.STUDENT };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.semesterId).toEqual({ $nin: [expiredSemester._id] });
      });

      it("should filter by date range", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        const fromDate = new Date("2024-01-01");
        const toDate = new Date("2024-12-31");
        const params: ListCoursesParams = {
          page: 1, limit: 10, userRole: Role.ADMIN,
          from: fromDate,
          to: toDate
        };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.createdAt.$gte).toEqual(fromDate);
        expect(filter.createdAt.$lte).toEqual(toDate);
      });
    });

    describe("completeCourse Fallback Logic", () => {
      it("should calculate missing counts", async () => {
        const mockCourse = { ...course, status: CourseStatus.ONGOING, statistics: {} }; // No stats
        (CourseModel.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockCourse),
        });

        (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue([]); // No students
        (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
        (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockCourse);

        // Mock counts
        (LessonModel.countDocuments as jest.Mock).mockResolvedValue(5);
        (QuizModel.countDocuments as jest.Mock).mockResolvedValue(3);
        (AssignmentModel.countDocuments as jest.Mock).mockResolvedValue(2);

        await completeCourse(course._id.toString());

        expect(LessonModel.countDocuments).toHaveBeenCalled();
        expect(QuizModel.countDocuments).toHaveBeenCalled();
        expect(AssignmentModel.countDocuments).toHaveBeenCalled();
      });
    });
  });
  describe("Additional Branch Coverage Tests", () => {
    // ====================================
    // LIST COURSES BRANCHES
    // ====================================
    describe("listCourses Branch Coverage", () => {
      it("should handle expired semester filtering with specific semesterId", async () => {
        const expiredSemester = { _id: new mongoose.Types.ObjectId() };
        (SemesterModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue([expiredSemester]),
        });

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        };
        (CourseModel.find as jest.Mock).mockReturnValue(mockQuery);
        (CourseModel.countDocuments as jest.Mock).mockResolvedValue(0);

        // Request specific semester that is expired
        const params: ListCoursesParams = {
          page: 1,
          limit: 10,
          userRole: Role.STUDENT,
          semesterId: expiredSemester._id.toString()
        };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.semesterId).toEqual({
          $eq: expiredSemester._id.toString(),
          $nin: [expiredSemester._id]
        });
      });

      it("should filter by slug partial match", async () => {
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
          userRole: Role.ADMIN,
          slug: "test-slug"
        };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.slug).toEqual({ $regex: "test-slug", $options: "i" });
      });
    });

    // ====================================
    // CREATE COURSE BRANCHES
    // ====================================
    describe("createCourse Branch Coverage", () => {
      it("should validate capacity range", async () => {
        const uniqueTitle = `Capacity Test ${Date.now()}`;
        const invalidData = { ...course, title: uniqueTitle, capacity: 0 };
        // Mock title check to return null (no duplicate)
        (CourseModel.findOne as jest.Mock).mockResolvedValue(null);

        await expect(createCourse(invalidData, adminUser._id)).rejects.toThrow("Capacity must be between 1 and 500 students");

        const invalidData2 = { ...course, title: uniqueTitle, capacity: 501 };
        await expect(createCourse(invalidData2, adminUser._id)).rejects.toThrow("Capacity must be between 1 and 500 students");
      });

      it("should handle duplicate slug generation", async () => {
        // Setup matching specialization
        const specialistId = new mongoose.Types.ObjectId();
        const subjectWithSpec = { ...subject, specialistIds: [specialistId] };
        const teacherWithSpec = { ...teacherUser, specialistIds: [specialistId] };

        (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpec);
        (UserModel.find as jest.Mock).mockResolvedValue([teacherWithSpec]);

        (CourseModel.findOne as jest.Mock)
          .mockResolvedValueOnce(null) // Title check
          .mockResolvedValueOnce({ _id: "existing" }) // Slug check - exists
          .mockResolvedValueOnce(null); // Slug check - second attempt (with timestamp)

        (CourseModel.create as jest.Mock).mockResolvedValue(course);
        (CourseModel.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(course),
        });

        // Ensure teacher validation passes


        await createCourse(course, adminUser._id);

        expect(CourseModel.create).toHaveBeenCalledWith(expect.objectContaining({
          slug: expect.stringMatching(/-[0-9]+$/) // Should have timestamp appended
        }));
      });

      it("should handle notification errors gracefully", async () => {
        const uniqueTitle = `Notif Error Test ${Date.now()}`;
        const courseWithUniqueTitle = { ...course, title: uniqueTitle };

        // Setup matching specialization
        const specialistId = new mongoose.Types.ObjectId();
        const subjectWithSpec = { ...subject, specialistIds: [specialistId] };
        const teacherWithSpec = { ...teacherUser, specialistIds: [specialistId] };

        (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpec);

        // Mock UserModel.findById to return creator (teacher)
        (UserModel.findById as jest.Mock).mockResolvedValue(teacherWithSpec);

        // Mock UserModel.find to handle both teacher validation and admin lookup for notifications
        (UserModel.find as jest.Mock).mockImplementation((query) => {
          // For notification helper: find admins
          if (query?.role === 'ADMIN') {
            return {
              select: jest.fn().mockResolvedValue([{ _id: adminUser._id }])
            };
          }
          // For teacher validation
          return Promise.resolve([teacherWithSpec]);
        });

        (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
        (CourseModel.create as jest.Mock).mockResolvedValue(courseWithUniqueTitle);
        (CourseModel.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(courseWithUniqueTitle),
        });

        // Mock notification failure - this will be called by notifyAdminNewCourse
        (NotificationModel.insertMany as jest.Mock).mockRejectedValue(new Error("Notification failed"));

        const result = await createCourse(courseWithUniqueTitle, teacherUser._id);

        expect(result.course).toBeDefined();
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain("Failed to send notifications");
      });

      it("should rollback when logo upload fails", async () => {
        // Setup matching specialization
        const specialistId = new mongoose.Types.ObjectId();
        const subjectWithSpec = { ...subject, specialistIds: [specialistId] };
        const teacherWithSpec = { ...teacherUser, specialistIds: [specialistId] };

        (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpec);
        (UserModel.find as jest.Mock).mockResolvedValue([teacherWithSpec]);

        (CourseModel.findOne as jest.Mock).mockResolvedValue(null);
        (CourseModel.create as jest.Mock).mockResolvedValue(course);

        // Mock upload failure
        (uploadFile as jest.Mock).mockRejectedValue(new Error("Upload failed"));

        const logoFile = {
          filename: "logo.png",
          mimetype: "image/png",
          buffer: Buffer.from("test"),
        } as Express.Multer.File;

        await expect(createCourse(course, adminUser._id, logoFile)).rejects.toThrow("Upload failed");

        // Verify rollback
        expect(CourseModel.findByIdAndDelete).toHaveBeenCalledWith(course._id);
      });

      it("should validate specialist matching", async () => {
        const subjectWithSpec = { ...subject, specialistIds: [new mongoose.Types.ObjectId()] };
        (SubjectModel.findById as jest.Mock).mockResolvedValue(subjectWithSpec);

        // Teacher with NO matching specialist
        const teacherNoSpec = { ...teacherUser, specialistIds: [] };
        (UserModel.find as jest.Mock).mockResolvedValue([teacherNoSpec]);

        await expect(createCourse(course, adminUser._id)).rejects.toThrow("do not have the required specialization");
      });
    });

    // ====================================
    // UPDATE COURSE BRANCHES
    // ====================================
    describe("updateCourse Branch Coverage", () => {
      it("should regenerate slug when title changes", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        (CourseModel.findOne as jest.Mock)
          .mockResolvedValueOnce(course) // Find course
          .mockResolvedValueOnce(null) // Title check (no duplicate title)
          .mockResolvedValueOnce(null); // Slug check (no duplicate slug)

        // Fix mock for findByIdAndUpdate
        (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({ ...course, slug: "new-title" }),
        });

        const updateData = { title: "New Title" } as any;
        await updateCourse(course._id.toString(), updateData, adminUser._id);

        expect(CourseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ slug: "new-title" }));
      });

      it("should handle duplicate slug when title changes", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        (CourseModel.findOne as jest.Mock)
          .mockResolvedValueOnce(course) // Find course
          .mockResolvedValueOnce(null) // Title check
          .mockResolvedValueOnce({ _id: "existing" }); // Slug check - exists

        // Fix mock for findByIdAndUpdate
        (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({ ...course, slug: "new-title" }),
        });

        const updateData = { title: "New Title" } as any;
        await updateCourse(course._id.toString(), updateData, adminUser._id);

        // Should have checked for duplicate slug
        expect(CourseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ slug: "new-title" }));
      });

      it("should validate start date change for ongoing course", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        const startedCourse = { ...course, startDate: new Date("2020-01-01") }; // Already started
        (CourseModel.findOne as jest.Mock).mockResolvedValue(startedCourse);

        const updateData = { startDate: new Date("2025-01-01") } as any;
        await expect(updateCourse(course._id.toString(), updateData, adminUser._id))
          .rejects.toThrow("Cannot change start date of a course that has already started");
      });

      it("should validate new teachers when updating teacherIds", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        (CourseModel.findOne as jest.Mock).mockResolvedValue(course);

        const newTeacherId = new mongoose.Types.ObjectId();
        const updateData = { teacherIds: [newTeacherId.toString()] } as any;

        // Mock teacher not found or invalid
        (UserModel.find as jest.Mock).mockResolvedValue([]);

        await expect(updateCourse(course._id.toString(), updateData, adminUser._id))
          .rejects.toThrow("One or more teachers not found");
      });

      it("should validate existing teachers against new subject", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        (CourseModel.findOne as jest.Mock).mockResolvedValue(course);

        const newSubjectId = new mongoose.Types.ObjectId();
        const updateData = { subjectId: newSubjectId.toString() } as any;

        const newSubject = { ...subject, specialistIds: [new mongoose.Types.ObjectId()] };
        (SubjectModel.findById as jest.Mock).mockResolvedValue(newSubject);

        // Existing teacher has NO matching specialist
        const teacherNoSpec = { ...teacherUser, specialistIds: [] };
        (UserModel.find as jest.Mock).mockResolvedValue([teacherNoSpec]);

        await expect(updateCourse(course._id.toString(), updateData, adminUser._id))
          .rejects.toThrow("do not have the required specialization");
      });

      it("should handle updateCourse logo cleanup failure on DB error (Line 913)", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(adminUser);
        (CourseModel.findOne as jest.Mock).mockResolvedValue(course);

        // Mock upload success
        (uploadFile as jest.Mock).mockResolvedValue({
          publicUrl: "http://new-logo.com",
          key: "new-key"
        });

        // Mock DB update failure
        (CourseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockRejectedValue(new Error("DB Update Failed")),
        });

        // Mock cleanup failure
        (removeFile as jest.Mock).mockRejectedValue(new Error("Cleanup Failed"));

        const logoFile = {
          filename: "logo.png",
          mimetype: "image/png",
          buffer: Buffer.from("test"),
        } as Express.Multer.File;

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await expect(updateCourse(course._id.toString(), {} as any, adminUser._id, logoFile))
          .rejects.toThrow("DB Update Failed");

        expect(removeFile).toHaveBeenCalledWith("new-key");
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to cleanup new logo"), expect.anything());

        consoleSpy.mockRestore();
      });
    });

    // ====================================
    // MISSING BRANCHES COVERAGE
    // ====================================
    describe("Specific Missing Branches", () => {
      it("should filter onlyDeleted for ADMIN (Line 164)", async () => {
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
          userRole: Role.ADMIN,
          onlyDeleted: true
        };
        await listCourses(params);

        const filter = (CourseModel.find as jest.Mock).mock.calls[0][0];
        expect(filter.isDeleted).toBe(true);
      });

      it("should use existing stats in completeCourse (Lines 1869, 1871, 1873)", async () => {
        const courseWithStats = {
          ...course,
          statistics: {
            totalLessons: 10,
            totalQuizzes: 5,
            totalAssignments: 2,
            totalAttendances: 0
          }
        };

        (CourseModel.findById as jest.Mock).mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(courseWithStats),
        });

        (EnrollmentModel.aggregate as jest.Mock).mockResolvedValue([]);
        (EnrollmentModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
        (CourseModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(courseWithStats);

        // Mock counts - SHOULD NOT BE CALLED for existing stats
        (LessonModel.countDocuments as jest.Mock).mockClear();
        (QuizModel.countDocuments as jest.Mock).mockClear();
        (AssignmentModel.countDocuments as jest.Mock).mockClear();

        await completeCourse(course._id.toString());

        expect(LessonModel.countDocuments).not.toHaveBeenCalled();
        expect(QuizModel.countDocuments).not.toHaveBeenCalled();
        expect(AssignmentModel.countDocuments).not.toHaveBeenCalled();
      });
    });
  });
});

