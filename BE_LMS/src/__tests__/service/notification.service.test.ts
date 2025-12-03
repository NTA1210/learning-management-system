// Notification Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";

// Mock all models before importing services
jest.mock("@/models/notification.model");
jest.mock("@/models/user.model");
jest.mock("@/models/course.model");
jest.mock("@/models/enrollment.model");
jest.mock("@/models/announcement.model");
jest.mock("@/utils/appAssert");

// Import models for mocking
import NotificationModel from "@/models/notification.model";
import UserModel from "@/models/user.model";
import CourseModel from "@/models/course.model";
import EnrollmentModel from "@/models/enrollment.model";
import AnnouncementModel from "@/models/announcement.model";
import appAssert from "@/utils/appAssert";

// Import services
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

describe("🔔 Notification Service Unit Tests", () => {
    let adminUser: any;
    let teacherUser: any;
    let studentUser: any;
    let course: any;
    let notification: any;

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

        studentUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "student_test",
            email: "student@test.com",
            role: Role.STUDENT,
        };

        course = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Course",
            teacherIds: [teacherUser._id],
        };

        notification = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Notification",
            message: "This is a test notification",
            recipientUser: studentUser._id,
            recipientType: "user",
            isRead: false,
            isDeleted: false,
            createdAt: new Date(),
        };

        // Reset all mocks
        jest.clearAllMocks();

        // appAssert: throw Error(message) when condition falsy
        (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
            if (!condition) throw new Error(message);
        });
    });

    // ====================================
    // CREATE NOTIFICATION TESTS
    // ====================================
    describe("createNotification", () => {
        it("should create user notification successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (NotificationModel.create as jest.Mock).mockResolvedValue(notification);
            
            // Mock CourseModel.find().select() chain
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([course]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);
            
            // Mock EnrollmentModel.exists
            (EnrollmentModel.exists as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const data = {
                title: "Test Notification",
                message: "Test message",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
            };

            const result = await createNotification(data, teacherUser._id, Role.TEACHER);

            expect(result).toBeDefined();
            expect(NotificationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: data.title,
                    message: data.message,
                    sender: teacherUser._id,
                    recipientUser: data.recipientUser,
                    recipientType: "user",
                    isRead: false,
                })
            );
        });

        it("should create system notification successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (NotificationModel.create as jest.Mock).mockResolvedValue({
                ...notification,
                recipientType: "system",
            });

            const data = {
                title: "System Notification",
                message: "System message",
                recipientType: "system" as const,
                recipientUser: studentUser._id.toString(),
            };

            const result = await createNotification(data, adminUser._id, Role.ADMIN);

            expect(result).toBeDefined();
            expect(NotificationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: data.title,
                    message: data.message,
                    recipientUser: data.recipientUser,
                    recipientType: "system",
                    isRead: false,
                })
            );
        });

        it("should throw error when recipient user not found", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: new mongoose.Types.ObjectId().toString(),
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("Recipient user not found");
        });

        it("should throw error when recipientUser is missing", async () => {
            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: undefined as any,
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("recipientUser is required");
        });

        it("should validate course exists when recipientCourse is provided", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue(null);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
                recipientCourse: new mongoose.Types.ObjectId().toString(),
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("Course not found");
        });

        it("should validate teacher can only send to enrolled students", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            
            // Mock CourseModel.find().select() chain
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([course]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);
            (EnrollmentModel.exists as jest.Mock).mockResolvedValue(null);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("You can only message students enrolled in your courses");
        });

        it("should validate teacher is assigned to course when recipientCourse provided", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId(), title: "Other Course" });
            
            // Mock CourseModel.find().select() chain
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([course]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
                recipientCourse: new mongoose.Types.ObjectId().toString(), // Different course
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("You are not a teacher of this course");
        });

        it("should validate student is enrolled in specific course when recipientCourse provided", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);
            
            // Mock CourseModel.find().select() chain - teacher owns the course
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([course]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);
            
            // Student is NOT enrolled in this specific course
            (EnrollmentModel.exists as jest.Mock).mockResolvedValue(null);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
                recipientCourse: course._id.toString(),
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("Student is not enrolled in this course");
        });

        it("should create notification when teacher sends to enrolled student in specific course", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);
            
            // Mock CourseModel.find().select() chain - teacher owns the course
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([course]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);
            
            // Student IS enrolled in this specific course
            (EnrollmentModel.exists as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
            (NotificationModel.create as jest.Mock).mockResolvedValue({
                ...notification,
                recipientCourse: course._id,
            });

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
                recipientCourse: course._id.toString(),
            };

            const result = await createNotification(data, teacherUser._id, Role.TEACHER);

            expect(result).toBeDefined();
            expect(NotificationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientCourse: course._id.toString(),
                })
            );
        });

        it("should throw error for invalid recipient type", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "invalid" as any,
                recipientUser: studentUser._id.toString(),
            };

            await expect(
                createNotification(data, adminUser._id, Role.ADMIN)
            ).rejects.toThrow("Invalid recipient type");
        });

        it("should throw error when teacher has no courses", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            
            // Mock CourseModel.find().select() chain - return empty array
            const mockCourseSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (CourseModel.find as jest.Mock).mockReturnValue(mockCourseSelect);

            const data = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: studentUser._id.toString(),
            };

            await expect(
                createNotification(data, teacherUser._id, Role.TEACHER)
            ).rejects.toThrow("You are not assigned to any courses");
        });
    });

    // ====================================
    // GET NOTIFICATIONS TESTS
    // ====================================
    describe("getNotifications", () => {
        it("should get notifications with pagination", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            // Mock EnrollmentModel.find().select() chain
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            const result = await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined });

            expect(result).toBeDefined();
            expect(result.notifications).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it("should filter notifications by read status", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            // Mock EnrollmentModel.find().select() chain
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: false });

            expect(NotificationModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientUser: studentUser._id,
                    isRead: false,
                    isDeleted: false,
                })
            );
        });

        it("should filter notifications by date range", async () => {
            const from = new Date("2024-01-01");
            const to = new Date("2024-12-31");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            // Mock EnrollmentModel.find().select() chain
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined, from, to });

            expect(NotificationModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientUser: studentUser._id,
                    createdAt: { $gte: from, $lte: to },
                })
            );
        });

        it("should include announcements from enrolled courses", async () => {
            const mockEnrollment = {
                courseId: course._id,
            };
            const mockAnnouncement = {
                _id: new mongoose.Types.ObjectId(),
                title: "Course Announcement",
                content: "Announcement content",
                courseId: { _id: course._id, title: "Test Course" },
                authorId: { _id: teacherUser._id, username: "teacher_test" },
                publishedAt: new Date(),
            };

            const mockNotifQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            const mockAnnouncementQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([mockAnnouncement]),
            };

            (NotificationModel.find as jest.Mock).mockReturnValue(mockNotifQuery);
            
            // Mock EnrollmentModel.find().select() chain
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([mockEnrollment]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue(mockAnnouncementQuery);

            const result = await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined });

            // Should have both notification and announcement
            expect(result.notifications.length).toBeGreaterThanOrEqual(1);

            // Check that announcement filter includes enrolled courses
            expect(AnnouncementModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    $or: expect.arrayContaining([
                        { courseId: { $in: [course._id] } },
                    ]),
                })
            );
        });

        it("should merge and sort notifications and announcements by date", async () => {
            const oldNotif = {
                ...notification,
                _id: new mongoose.Types.ObjectId(),
                createdAt: new Date("2024-01-01"),
            };
            const newAnnouncement = {
                _id: new mongoose.Types.ObjectId(),
                title: "New Announcement",
                content: "Content",
                publishedAt: new Date("2024-12-01"),
                authorId: {},
            };

            const mockNotifQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([oldNotif]),
            };
            const mockAnnouncementQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([newAnnouncement]),
            };

            (NotificationModel.find as jest.Mock).mockReturnValue(mockNotifQuery);
            
            // Mock EnrollmentModel.find().select() chain
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue(mockAnnouncementQuery);

            const result = await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined });

            // Newer items should come first
            expect(result.notifications[0].type).toBe("announcement");
        });

        it("should filter notifications by from date only", async () => {
            const from = new Date("2024-01-01");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined, from });

            expect(NotificationModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $gte: from },
                })
            );
        });

        it("should filter notifications by to date only", async () => {
            const to = new Date("2024-12-31");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            await getNotifications(studentUser._id, { page: 1, limit: 10, isRead: undefined, to });

            expect(NotificationModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $lte: to },
                })
            );
        });

        it("should use default pagination values when not provided", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([notification]),
            };
            (NotificationModel.find as jest.Mock).mockReturnValue(mockQuery);
            
            const mockEnrollmentSelect = {
                select: jest.fn().mockResolvedValue([]),
            };
            (EnrollmentModel.find as jest.Mock).mockReturnValue(mockEnrollmentSelect);
            
            (AnnouncementModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            });

            const result = await getNotifications(studentUser._id, { isRead: undefined } as any);

            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });
    });

    // ====================================
    // MARK AS READ TESTS
    // ====================================
    describe("markNotificationAsRead", () => {
        it("should mark notification as read successfully", async () => {
            const mockNotification = {
                ...notification,
                isRead: false,
                save: jest.fn().mockResolvedValue(true),
            };
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await markNotificationAsRead(notification._id.toString(), studentUser._id);

            expect(result.isRead).toBe(true);
            expect(result.readAt).toBeDefined();
            expect(mockNotification.save).toHaveBeenCalled();
        });

        it("should throw error when notification not found", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                markNotificationAsRead(notification._id.toString(), studentUser._id)
            ).rejects.toThrow("Notification not found");
        });

        it("should only mark own notifications", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                markNotificationAsRead(notification._id.toString(), new mongoose.Types.ObjectId())
            ).rejects.toThrow("Notification not found");

            expect(NotificationModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientUser: expect.anything(),
                    isDeleted: false,
                })
            );
        });
    });

    describe("markNotificationsAsRead", () => {
        it("should mark multiple notifications as read", async () => {
            const notifIds = [
                new mongoose.Types.ObjectId().toString(),
                new mongoose.Types.ObjectId().toString(),
            ];

            (NotificationModel.find as jest.Mock).mockResolvedValue([{}, {}]);
            (NotificationModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });

            const result = await markNotificationsAsRead(notifIds, studentUser._id);

            expect(result.count).toBe(2);
            expect(result.message).toContain("2 notification(s)");
            expect(NotificationModel.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: { $in: notifIds },
                    recipientUser: studentUser._id,
                }),
                expect.objectContaining({
                    $set: {
                        isRead: true,
                        readAt: expect.any(Date),
                    },
                })
            );
        });

        it("should throw error when no notifications found", async () => {
            (NotificationModel.find as jest.Mock).mockResolvedValue([]);

            await expect(
                markNotificationsAsRead([new mongoose.Types.ObjectId().toString()], studentUser._id)
            ).rejects.toThrow("No notifications found");
        });
    });

    describe("markAllNotificationsAsRead", () => {
        it("should mark all unread notifications as read", async () => {
            (NotificationModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

            const result = await markAllNotificationsAsRead(studentUser._id);

            expect(result.count).toBe(5);
            expect(result.message).toContain("5 notification(s)");
            expect(NotificationModel.updateMany).toHaveBeenCalledWith(
                {
                    recipientUser: studentUser._id,
                    isRead: false,
                    isDeleted: false,
                },
                expect.objectContaining({
                    $set: {
                        isRead: true,
                        readAt: expect.any(Date),
                    },
                })
            );
        });
    });

    // ====================================
    // DELETE NOTIFICATION TESTS
    // ====================================
    describe("deleteNotification", () => {
        it("should soft delete notification successfully", async () => {
            const mockNotification = {
                ...notification,
                isDeleted: false,
                save: jest.fn().mockResolvedValue(true),
            };
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await deleteNotification(notification._id.toString(), studentUser._id);

            expect(result.deleted).toBe(true);
            expect(mockNotification.isDeleted).toBe(true);
            expect(mockNotification.deletedAt).toBeDefined();
            expect(mockNotification.save).toHaveBeenCalled();
        });

        it("should throw error when notification not found", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteNotification(notification._id.toString(), studentUser._id)
            ).rejects.toThrow("Notification not found");
        });
    });

    describe("hardDeleteNotification", () => {
        it("should permanently delete notification", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(notification);
            (NotificationModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

            const result = await hardDeleteNotification(notification._id.toString(), studentUser._id);

            expect(result.deleted).toBe(true);
            expect(result.message).toContain("permanently deleted");
            expect(NotificationModel.deleteOne).toHaveBeenCalledWith({
                _id: notification._id.toString(),
                recipientUser: studentUser._id,
            });
        });

        it("should throw error when notification not found", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                hardDeleteNotification(notification._id.toString(), studentUser._id)
            ).rejects.toThrow("Notification not found");
        });
    });

    // ====================================
    // GET UNREAD COUNT TESTS
    // ====================================
    describe("getUnreadNotificationCount", () => {
        it("should return unread notification count", async () => {
            (NotificationModel.countDocuments as jest.Mock).mockResolvedValue(3);

            const result = await getUnreadNotificationCount(studentUser._id);

            expect(result.count).toBe(3);
            expect(NotificationModel.countDocuments).toHaveBeenCalledWith({
                recipientUser: studentUser._id,
                isRead: false,
                isDeleted: false,
            });
        });
    });

    // ====================================
    // UNDO DELETE TESTS
    // ====================================
    describe("undoDeleteNotification", () => {
        it("should restore deleted notification within time window", async () => {
            const mockNotification = {
                ...notification,
                isDeleted: true,
                deletedAt: new Date(Date.now() - 1000), // 1 second ago
                save: jest.fn().mockResolvedValue(true),
            };
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await undoDeleteNotification(notification._id.toString(), studentUser._id);

            expect(result.restored).toBe(true);
            expect(mockNotification.isDeleted).toBe(false);
            expect(mockNotification.deletedAt).toBeUndefined();
            expect(mockNotification.save).toHaveBeenCalled();
        });

        it("should throw error when undo period has expired", async () => {
            const mockNotification = {
                ...notification,
                isDeleted: true,
                deletedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
                save: jest.fn(),
            };
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            await expect(
                undoDeleteNotification(notification._id.toString(), studentUser._id)
            ).rejects.toThrow("Undo period has expired");
        });

        it("should throw error when notification not found or not deleted", async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                undoDeleteNotification(notification._id.toString(), studentUser._id)
            ).rejects.toThrow("Notification not found or not deleted");
        });
    });
});
