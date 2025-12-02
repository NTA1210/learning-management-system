// Notification Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/notification.service", () => ({
    createNotification: jest.fn(),
    getNotifications: jest.fn(),
    markNotificationAsRead: jest.fn(),
    markNotificationsAsRead: jest.fn(),
    markAllNotificationsAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    hardDeleteNotification: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
    undoDeleteNotification: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/notification.schemas", () => ({
    createNotificationSchema: {
        parse: jest.fn(),
    },
    listNotificationsSchema: {
        parse: jest.fn(),
    },
    notificationIdSchema: {
        parse: jest.fn(),
    },
    markReadNotificationSchema: {
        parse: jest.fn(),
    },
}));

// Import controller and services
import {
    createNotificationHandler,
    getNotificationsHandler,
    getUnreadCountHandler,
    markNotificationAsReadHandler,
    markNotificationsAsReadHandler,
    markAllNotificationsAsReadHandler,
    deleteNotificationHandler,
    undoDeleteNotificationHandler,
    hardDeleteNotificationHandler,
} from "@/controller/notification.controller";
import * as notificationService from "@/services/notification.service";
import * as notificationSchemas from "@/validators/notification.schemas";

describe("🔔 Notification Controller Unit Tests", () => {
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockReq = {
            userId: new mongoose.Types.ObjectId().toString(),
            role: Role.ADMIN,
            query: {},
            params: {},
            body: {},
        } as any;
        mockRes = {
            success: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    // ====================================
    // CREATE NOTIFICATION TESTS
    // ====================================
    describe("createNotificationHandler", () => {
        it("should create notification successfully", async () => {
            const mockData = {
                title: "Test Notification",
                message: "Test message",
                recipientType: "user" as const,
                recipientUser: new mongoose.Types.ObjectId(),
            };
            const mockNotification = {
                _id: new mongoose.Types.ObjectId(),
                ...mockData,
            };

            (notificationSchemas.createNotificationSchema.parse as jest.Mock).mockReturnValue(mockData);
            (notificationService.createNotification as jest.Mock).mockResolvedValue(mockNotification);

            mockReq.body = mockData;

            await createNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                mockData,
                mockReq.userId,
                Role.ADMIN
            );
            expect(mockRes.success).toHaveBeenCalledWith(201, {
                data: mockNotification,
                message: "Notification(s) created successfully",
            });
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            (notificationSchemas.createNotificationSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await createNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const serviceError = new Error("Service error");
            (notificationSchemas.createNotificationSchema.parse as jest.Mock).mockReturnValue({});
            (notificationService.createNotification as jest.Mock).mockRejectedValue(serviceError);

            await createNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(serviceError);
        });
    });

    // ====================================
    // GET NOTIFICATIONS TESTS
    // ====================================
    describe("getNotificationsHandler", () => {
        it("should get notifications with pagination", async () => {
            const mockQuery = { page: 1, limit: 10, isRead: undefined };
            const mockNotifications = [
                { _id: "1", title: "Notification 1" },
                { _id: "2", title: "Notification 2" },
            ];
            const mockPagination = { total: 2, page: 1, limit: 10, totalPages: 1 };

            (notificationSchemas.listNotificationsSchema.parse as jest.Mock).mockReturnValue(mockQuery);
            (notificationService.getNotifications as jest.Mock).mockResolvedValue({
                notifications: mockNotifications,
                pagination: mockPagination,
            });

            mockReq.query = { page: "1", limit: "10" };

            await getNotificationsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.getNotifications).toHaveBeenCalledWith(mockReq.userId, mockQuery);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockNotifications,
                message: "Notifications retrieved successfully",
                pagination: mockPagination,
            });
        });

        it("should filter notifications by read status", async () => {
            const mockQuery = { page: 1, limit: 10, isRead: false };

            (notificationSchemas.listNotificationsSchema.parse as jest.Mock).mockReturnValue(mockQuery);
            (notificationService.getNotifications as jest.Mock).mockResolvedValue({
                notifications: [],
                pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
            });

            mockReq.query = { page: "1", limit: "10", isRead: "false" };

            await getNotificationsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.getNotifications).toHaveBeenCalledWith(
                mockReq.userId,
                expect.objectContaining({ isRead: false })
            );
        });

        it("should handle service errors", async () => {
            const serviceError = new Error("Service error");
            (notificationSchemas.listNotificationsSchema.parse as jest.Mock).mockReturnValue({});
            (notificationService.getNotifications as jest.Mock).mockRejectedValue(serviceError);

            await getNotificationsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(serviceError);
        });
    });

    // ====================================
    // GET UNREAD COUNT TESTS
    // ====================================
    describe("getUnreadCountHandler", () => {
        it("should get unread notification count", async () => {
            const mockCount = { count: 5 };

            (notificationService.getUnreadNotificationCount as jest.Mock).mockResolvedValue(mockCount);

            await getUnreadCountHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.getUnreadNotificationCount).toHaveBeenCalledWith(mockReq.userId);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockCount,
                message: "Unread count retrieved successfully",
            });
        });
    });

    // ====================================
    // MARK AS READ TESTS
    // ====================================
    describe("markNotificationAsReadHandler", () => {
        it("should mark single notification as read", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const mockNotification = {
                _id: notificationId,
                isRead: true,
                readAt: new Date(),
            };

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(mockNotification);

            mockReq.params = { id: notificationId };

            await markNotificationAsReadHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(
                notificationId,
                mockReq.userId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockNotification,
                message: "Notification marked as read",
            });
        });

        it("should handle notification not found error", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const error = new Error("Notification not found");

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.markNotificationAsRead as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: notificationId };

            await markNotificationAsReadHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("markNotificationsAsReadHandler", () => {
        it("should mark multiple notifications as read", async () => {
            const notificationIds = [
                new mongoose.Types.ObjectId().toString(),
                new mongoose.Types.ObjectId().toString(),
            ];
            const mockResult = {
                count: 2,
                message: "Marked 2 notification(s) as read",
            };

            (notificationSchemas.markReadNotificationSchema.parse as jest.Mock).mockReturnValue({
                notificationIds,
            });
            (notificationService.markNotificationsAsRead as jest.Mock).mockResolvedValue(mockResult);

            mockReq.body = { notificationIds };

            await markNotificationsAsReadHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.markNotificationsAsRead).toHaveBeenCalledWith(
                notificationIds,
                mockReq.userId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockResult,
                message: mockResult.message,
            });
        });
    });

    describe("markAllNotificationsAsReadHandler", () => {
        it("should mark all notifications as read", async () => {
            const mockResult = {
                count: 10,
                message: "Marked 10 notification(s) as read",
            };

            (notificationService.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(mockResult);

            await markAllNotificationsAsReadHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledWith(mockReq.userId);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockResult,
                message: mockResult.message,
            });
        });
    });

    // ====================================
    // DELETE NOTIFICATION TESTS
    // ====================================
    describe("deleteNotificationHandler", () => {
        it("should soft delete notification successfully", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const mockResult = {
                deleted: true,
                message: "Notification deleted successfully",
            };

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.deleteNotification as jest.Mock).mockResolvedValue(mockResult);

            mockReq.params = { id: notificationId };

            await deleteNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.deleteNotification).toHaveBeenCalledWith(
                notificationId,
                mockReq.userId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockResult,
                message: mockResult.message,
            });
        });
    });

    describe("undoDeleteNotificationHandler", () => {
        it("should undo delete notification successfully", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const mockResult = {
                restored: true,
                notification: { _id: notificationId },
                message: "Notification restored successfully",
            };

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.undoDeleteNotification as jest.Mock).mockResolvedValue(mockResult);

            mockReq.params = { id: notificationId };

            await undoDeleteNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.undoDeleteNotification).toHaveBeenCalledWith(
                notificationId,
                mockReq.userId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockResult,
                message: mockResult.message,
            });
        });

        it("should handle undo period expired error", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const error = new Error("Undo period has expired");

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.undoDeleteNotification as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: notificationId };

            await undoDeleteNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe("hardDeleteNotificationHandler", () => {
        it("should permanently delete notification", async () => {
            const notificationId = new mongoose.Types.ObjectId().toString();
            const mockResult = {
                deleted: true,
                message: "Notification permanently deleted",
            };

            (notificationSchemas.notificationIdSchema.parse as jest.Mock).mockReturnValue(notificationId);
            (notificationService.hardDeleteNotification as jest.Mock).mockResolvedValue(mockResult);

            mockReq.params = { id: notificationId };

            await hardDeleteNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.hardDeleteNotification).toHaveBeenCalledWith(
                notificationId,
                mockReq.userId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockResult,
                message: mockResult.message,
            });
        });
    });

    // ====================================
    // ERROR HANDLING TESTS
    // ====================================
    describe("Error Handling", () => {
        it("should handle missing userId in request", async () => {
            mockReq.userId = undefined;

            const mockQuery = { page: 1, limit: 10 };
            (notificationSchemas.listNotificationsSchema.parse as jest.Mock).mockReturnValue(mockQuery);
            (notificationService.getNotifications as jest.Mock).mockResolvedValue({
                notifications: [],
                pagination: {},
            });

            await getNotificationsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.getNotifications).toHaveBeenCalledWith(undefined, mockQuery);
        });

        it("should handle missing role in request", async () => {
            mockReq.role = undefined;

            const mockData = {
                title: "Test",
                message: "Test",
                recipientType: "user" as const,
                recipientUser: new mongoose.Types.ObjectId(),
            };

            (notificationSchemas.createNotificationSchema.parse as jest.Mock).mockReturnValue(mockData);
            (notificationService.createNotification as jest.Mock).mockResolvedValue({});

            mockReq.body = mockData;

            await createNotificationHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                mockData,
                mockReq.userId,
                undefined
            );
        });
    });
});
