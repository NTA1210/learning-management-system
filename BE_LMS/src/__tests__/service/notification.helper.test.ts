// Notification Helper Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock all models before importing helpers
jest.mock("@/models/notification.model");
jest.mock("@/models/user.model");
jest.mock("@/models/course.model");

// Import models for mocking
import NotificationModel from "@/models/notification.model";
import UserModel from "@/models/user.model";
import CourseModel from "@/models/course.model";

// Import helpers
import {
    notifyNewSystemFeedback,
    notifyTeacherFeedback,
    notifyCourseFeedback,
    notifyAdminNewCourse,
    notifyTeacherCourseApproved,
    notifyTeacherAssigned,
} from "@/services/helpers/notification.helper";

describe("🔔 Notification Helper Unit Tests", () => {
    let adminUser: any;
    let teacherUser: any;
    let course: any;

    beforeEach(() => {
        // Create mock data
        adminUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "admin_test",
            email: "admin@test.com",
            role: Role.ADMIN,
        };

        teacherUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "teacher_test",
            email: "teacher@test.com",
            role: Role.TEACHER,
        };

        course = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Course",
            teacherIds: [teacherUser._id],
        };

        // Reset all mocks
        jest.clearAllMocks();
    });

    // ====================================
    // NOTIFY NEW SYSTEM FEEDBACK TESTS
    // ====================================
    describe("notifyNewSystemFeedback", () => {
        it("should send notifications to all admins", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyNewSystemFeedback(
                "feedback-id",
                "This is a test feedback content",
                "Test User"
            );

            expect(UserModel.find).toHaveBeenCalledWith({ role: Role.ADMIN });
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Feedback mới cho hệ thống",
                        recipientUser: adminUser._id,
                    }),
                ])
            );
        });

        it("should not send notifications when no admins found", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);

            await notifyNewSystemFeedback(
                "feedback-id",
                "Test feedback",
                "Test User"
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });

        it("should truncate long feedback content", async () => {
            const longContent = "A".repeat(200);
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyNewSystemFeedback("feedback-id", longContent, "Test User");

            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining("..."),
                    }),
                ])
            );
        });
    });

    // ====================================
    // NOTIFY TEACHER FEEDBACK TESTS
    // ====================================
    describe("notifyTeacherFeedback", () => {
        it("should send notifications to all admins about teacher feedback", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyTeacherFeedback(
                teacherUser._id.toString(),
                "Great teacher!",
                5,
                "Student Name"
            );

            expect(UserModel.find).toHaveBeenCalledWith({ role: Role.ADMIN });
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Feedback mới về giảng viên",
                        message: expect.stringContaining("5/5 sao"),
                    }),
                ])
            );
        });

        it("should not send notifications when no admins found", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);

            await notifyTeacherFeedback(
                teacherUser._id.toString(),
                "Great teacher!",
                5,
                "Student Name"
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });
    });

    // ====================================
    // NOTIFY COURSE FEEDBACK TESTS
    // ====================================
    describe("notifyCourseFeedback", () => {
        it("should send notifications to course teachers and admins", async () => {
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(course),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            expect(CourseModel.findById).toHaveBeenCalledWith(course._id.toString());
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Khóa học của bạn nhận đánh giá mới",
                        recipientUser: teacherUser._id,
                    }),
                    expect.objectContaining({
                        title: "Feedback mới về khóa học",
                        recipientUser: adminUser._id,
                    }),
                ])
            );
        });

        it("should not send notifications when course not found", async () => {
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(null),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });

        it("should handle course with no teachers", async () => {
            const courseWithNoTeachers = {
                ...course,
                teacherIds: [],
            };
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(courseWithNoTeachers),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            // Should still send to admins
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Feedback mới về khóa học",
                        recipientUser: adminUser._id,
                    }),
                ])
            );
        });

        it("should not send notifications when no recipients", async () => {
            const courseWithNoTeachers = {
                ...course,
                teacherIds: [],
            };
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(courseWithNoTeachers),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });

        it("should handle course with undefined teacherIds", async () => {
            const courseWithUndefinedTeachers = {
                ...course,
                teacherIds: undefined,
            };
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(courseWithUndefinedTeachers),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            // Should still send to admins only
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Feedback mới về khóa học",
                        recipientUser: adminUser._id,
                    }),
                ])
            );
        });

        it("should handle course with multiple teachers", async () => {
            const teacher2 = {
                _id: new mongoose.Types.ObjectId(),
                username: "teacher2_test",
                email: "teacher2@test.com",
                role: Role.TEACHER,
            };
            const courseWithMultipleTeachers = {
                ...course,
                teacherIds: [teacherUser._id, teacher2._id],
            };
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(courseWithMultipleTeachers),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student Name"
            );

            // Should send to both teachers and admin
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        recipientUser: teacherUser._id,
                    }),
                    expect.objectContaining({
                        recipientUser: teacher2._id,
                    }),
                    expect.objectContaining({
                        recipientUser: adminUser._id,
                    }),
                ])
            );
        });
    });

    // ====================================
    // NOTIFY ADMIN NEW COURSE TESTS
    // ====================================
    describe("notifyAdminNewCourse", () => {
        it("should send notifications to all admins about new course", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyAdminNewCourse(
                course._id.toString(),
                "New Course Title",
                "Teacher Name"
            );

            expect(UserModel.find).toHaveBeenCalledWith({ role: Role.ADMIN });
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Khóa học mới chờ duyệt",
                        message: expect.stringContaining("Teacher Name"),
                        recipientCourse: course._id.toString(),
                    }),
                ])
            );
        });

        it("should not send notifications when no admins found", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);

            await notifyAdminNewCourse(
                course._id.toString(),
                "New Course Title",
                "Teacher Name"
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });
    });

    // ====================================
    // NOTIFY TEACHER COURSE APPROVED TESTS
    // ====================================
    describe("notifyTeacherCourseApproved", () => {
        it("should send notification to teacher when course is approved", async () => {
            (NotificationModel.create as jest.Mock).mockResolvedValue({});

            await notifyTeacherCourseApproved(
                course._id.toString(),
                "Approved Course",
                teacherUser._id.toString()
            );

            expect(NotificationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Khóa học đã được duyệt",
                    message: expect.stringContaining("Approved Course"),
                    recipientUser: teacherUser._id.toString(),
                    recipientCourse: course._id.toString(),
                })
            );
        });
    });

    // ====================================
    // NOTIFY TEACHER ASSIGNED TESTS
    // ====================================
    describe("notifyTeacherAssigned", () => {
        it("should send notifications to assigned teachers", async () => {
            const teacherIds = [
                new mongoose.Types.ObjectId().toString(),
                new mongoose.Types.ObjectId().toString(),
            ];
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyTeacherAssigned(
                course._id.toString(),
                "Course Title",
                teacherIds
            );

            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        title: "Phân công giảng dạy",
                        recipientUser: teacherIds[0],
                    }),
                    expect.objectContaining({
                        title: "Phân công giảng dạy",
                        recipientUser: teacherIds[1],
                    }),
                ])
            );
        });

        it("should not send notifications when teacherIds is empty", async () => {
            await notifyTeacherAssigned(
                course._id.toString(),
                "Course Title",
                []
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });

        it("should not send notifications when teacherIds is undefined", async () => {
            await notifyTeacherAssigned(
                course._id.toString(),
                "Course Title",
                undefined as any
            );

            expect(NotificationModel.insertMany).not.toHaveBeenCalled();
        });
    });

    // ====================================
    // ERROR HANDLING TESTS
    // ====================================
    describe("Error Handling", () => {
        it("should handle database errors gracefully in notifyNewSystemFeedback", async () => {
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockRejectedValue(
                new Error("Database connection failed")
            );

            await expect(
                notifyNewSystemFeedback("feedback-id", "Test feedback", "User")
            ).rejects.toThrow("Database connection failed");
        });

        it("should handle database errors in notifyTeacherCourseApproved", async () => {
            (NotificationModel.create as jest.Mock).mockRejectedValue(
                new Error("Database error")
            );

            await expect(
                notifyTeacherCourseApproved(
                    course._id.toString(),
                    "Course Title",
                    teacherUser._id.toString()
                )
            ).rejects.toThrow("Database error");
        });

        it("should handle errors when finding admins fails", async () => {
            (UserModel.find as jest.Mock).mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error("Query failed")),
            });

            await expect(
                notifyAdminNewCourse(
                    course._id.toString(),
                    "Course Title",
                    "Teacher Name"
                )
            ).rejects.toThrow("Query failed");
        });

        it("should handle errors when finding course fails in notifyCourseFeedback", async () => {
            (CourseModel.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error("Course query failed")),
            });

            await expect(
                notifyCourseFeedback(
                    course._id.toString(),
                    "Feedback",
                    5,
                    "User"
                )
            ).rejects.toThrow("Course query failed");
        });
    });

    // ====================================
    // EDGE CASE TESTS
    // ====================================
    describe("Edge Cases", () => {
        it("should handle exactly 100 character feedback content (no truncation)", async () => {
            const exactContent = "A".repeat(100);
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyNewSystemFeedback("feedback-id", exactContent, "User");

            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining(exactContent),
                    }),
                ])
            );
        });

        it("should truncate content longer than 100 characters", async () => {
            const longContent = "A".repeat(101);
            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyNewSystemFeedback("feedback-id", longContent, "User");

            // Verify message contains truncation indicator (...)
            const insertedNotifs = (NotificationModel.insertMany as jest.Mock).mock.calls[0][0];
            expect(insertedNotifs[0].message).toContain("...");
            // Ensure it doesn't contain the full long content
            expect(insertedNotifs[0].message).not.toBe(longContent);
        });

        it("should handle course with multiple teachers and admins", async () => {
            const teacher2 = {
                _id: new mongoose.Types.ObjectId(),
                username: "teacher2",
            };
            const admin2 = {
                _id: new mongoose.Types.ObjectId(),
                role: Role.ADMIN,
            };
            const courseWithMultiple = {
                ...course,
                teacherIds: [teacherUser._id, teacher2._id],
            };

            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue(courseWithMultiple),
            };
            (CourseModel.findById as jest.Mock).mockReturnValue(mockCourseSelect);

            const mockAdminSelect = {
                select: jest.fn().mockResolvedValue([adminUser, admin2]),
            };
            (UserModel.find as jest.Mock).mockReturnValue(mockAdminSelect);
            (NotificationModel.insertMany as jest.Mock).mockResolvedValue([]);

            await notifyCourseFeedback(
                course._id.toString(),
                "Great course!",
                5,
                "Student"
            );

            // Should send to 2 teachers + 2 admins = 4 recipients
            expect(NotificationModel.insertMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ recipientUser: teacherUser._id }),
                    expect.objectContaining({ recipientUser: teacher2._id }),
                    expect.objectContaining({ recipientUser: adminUser._id }),
                    expect.objectContaining({ recipientUser: admin2._id }),
                ])
            );
            const callArg = (NotificationModel.insertMany as jest.Mock).mock.calls[0][0];
            expect(callArg).toHaveLength(4);
        });
    });
});
