// Feedback Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";
import { FeedbackType } from "@/types/feedback.type";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/feedback.service", () => ({
    createFeedback: jest.fn(),
    listFeedbacks: jest.fn(),
    getFeedbackById: jest.fn(),
    getMyFeedbacks: jest.fn(),
    getFeedbacksByTarget: jest.fn(),
    deleteFeedback: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/feedback.schemas", () => ({
    createFeedbackSchema: {
        parse: jest.fn(),
    },
    listFeedbacksSchema: {
        parse: jest.fn(),
    },
    feedbackIdSchema: {
        parse: jest.fn(),
    },
    targetIdSchema: {
        parse: jest.fn(),
    },
}));

// Mock parseFormData
jest.mock("@/utils/parseFormData", () => ({
    parseFormData: jest.fn((data) => data),
}));

// Import controller and services
import {
    createFeedbackHandler,
    listFeedbacksHandler,
    getFeedbackByIdHandler,
    getMyFeedbacksHandler,
    getFeedbacksByTargetHandler,
    deleteFeedbackHandler,
} from "@/controller/feedback.controller";
import * as feedbackService from "@/services/feedback.service";
import * as feedbackSchemas from "@/validators/feedback.schemas";

describe("💬 Feedback Controller Unit Tests", () => {
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockReq = {
            userId: new mongoose.Types.ObjectId().toString(),
            role: Role.STUDENT,
            query: {},
            params: {},
            body: {},
            file: undefined,
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
    // CREATE FEEDBACK TESTS
    // ====================================
    describe("createFeedbackHandler", () => {
        it("should create feedback successfully without file", async () => {
            const mockData = {
                type: FeedbackType.SYSTEM,
                description: "Great system!",
                rating: 5,
            };
            const mockFeedback = {
                _id: new mongoose.Types.ObjectId(),
                ...mockData,
                userId: mockReq.userId,
            };

            (feedbackSchemas.createFeedbackSchema.parse as jest.Mock).mockReturnValue(mockData);
            (feedbackService.createFeedback as jest.Mock).mockResolvedValue(mockFeedback);

            mockReq.body = mockData;

            await createFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.createFeedback).toHaveBeenCalledWith(
                mockData,
                mockReq.userId,
                undefined
            );
            expect(mockRes.success).toHaveBeenCalledWith(201, {
                data: mockFeedback,
                message: "Feedback submitted successfully",
            });
        });

        it("should create feedback with file attachment", async () => {
            const mockData = {
                type: FeedbackType.SYSTEM,
                description: "Feedback with file",
                rating: 4,
            };
            const mockFile = {
                filename: "test.pdf",
                mimetype: "application/pdf",
                buffer: Buffer.from("test"),
            } as Express.Multer.File;
            const mockFeedback = {
                _id: new mongoose.Types.ObjectId(),
                ...mockData,
                key: "test-key",
            };

            (feedbackSchemas.createFeedbackSchema.parse as jest.Mock).mockReturnValue(mockData);
            (feedbackService.createFeedback as jest.Mock).mockResolvedValue(mockFeedback);

            mockReq.body = mockData;
            mockReq.file = mockFile;

            await createFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.createFeedback).toHaveBeenCalledWith(
                mockData,
                mockReq.userId,
                mockFile
            );
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            (feedbackSchemas.createFeedbackSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await createFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const serviceError = new Error("Service error");
            (feedbackSchemas.createFeedbackSchema.parse as jest.Mock).mockReturnValue({});
            (feedbackService.createFeedback as jest.Mock).mockRejectedValue(serviceError);

            await createFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(serviceError);
        });
    });

    // ====================================
    // LIST FEEDBACKS TESTS
    // ====================================
    describe("listFeedbacksHandler", () => {
        it("should list feedbacks with pagination for admin", async () => {
            const mockFilters = {
                page: 1,
                limit: 10,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };
            const mockFeedbacks = [
                { _id: "1", description: "Feedback 1", rating: 5 },
                { _id: "2", description: "Feedback 2", rating: 4 },
            ];
            const mockPagination = { total: 2, page: 1, limit: 10, totalPages: 1 };

            (feedbackSchemas.listFeedbacksSchema.parse as jest.Mock).mockReturnValue(mockFilters);
            (feedbackService.listFeedbacks as jest.Mock).mockResolvedValue({
                feedbacks: mockFeedbacks,
                pagination: mockPagination,
                averageRating: 4.5,
            });

            mockReq.role = Role.ADMIN;
            mockReq.query = { page: "1", limit: "10", sortBy: "createdAt", sortOrder: "desc" };

            await listFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.listFeedbacks).toHaveBeenCalledWith(
                mockFilters,
                mockReq.userId,
                Role.ADMIN
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockFeedbacks,
                message: "Feedbacks retrieved successfully",
                averageRating: 4.5,
                pagination: mockPagination,
            });
        });

        it("should filter feedbacks by type", async () => {
            const mockFilters = {
                page: 1,
                limit: 10,
                type: FeedbackType.TEACHER,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            (feedbackSchemas.listFeedbacksSchema.parse as jest.Mock).mockReturnValue(mockFilters);
            (feedbackService.listFeedbacks as jest.Mock).mockResolvedValue({
                feedbacks: [],
                pagination: {},
            });

            mockReq.query = { page: "1", limit: "10", type: FeedbackType.TEACHER, sortBy: "createdAt", sortOrder: "desc" };

            await listFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.listFeedbacks).toHaveBeenCalledWith(
                expect.objectContaining({ type: FeedbackType.TEACHER }),
                mockReq.userId,
                Role.STUDENT
            );
        });

        it("should handle service errors", async () => {
            const serviceError = new Error("Service error");
            (feedbackSchemas.listFeedbacksSchema.parse as jest.Mock).mockReturnValue({});
            (feedbackService.listFeedbacks as jest.Mock).mockRejectedValue(serviceError);

            await listFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(serviceError);
        });
    });

    // ====================================
    // GET FEEDBACK BY ID TESTS
    // ====================================
    describe("getFeedbackByIdHandler", () => {
        it("should get feedback by ID successfully", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const mockFeedback = {
                _id: feedbackId,
                description: "Test feedback",
                rating: 5,
            };

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.getFeedbackById as jest.Mock).mockResolvedValue(mockFeedback);

            mockReq.params = { id: feedbackId };

            await getFeedbackByIdHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.getFeedbackById).toHaveBeenCalledWith(
                feedbackId,
                mockReq.userId,
                Role.STUDENT
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockFeedback,
                message: "Feedback retrieved successfully",
            });
        });

        it("should handle feedback not found error", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const error = new Error("Feedback not found");

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.getFeedbackById as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: feedbackId };

            await getFeedbackByIdHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it("should handle permission denied error", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const error = new Error("You can only view your own feedbacks");

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.getFeedbackById as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: feedbackId };

            await getFeedbackByIdHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // GET MY FEEDBACKS TESTS
    // ====================================
    describe("getMyFeedbacksHandler", () => {
        it("should get user's own feedbacks with pagination", async () => {
            const mockFeedbacks = [
                { _id: "1", description: "My feedback 1" },
                { _id: "2", description: "My feedback 2" },
            ];
            const mockPagination = { total: 2, page: 1, limit: 10, totalPages: 1 };

            (feedbackService.getMyFeedbacks as jest.Mock).mockResolvedValue({
                feedbacks: mockFeedbacks,
                pagination: mockPagination,
            });

            mockReq.query = { page: "1", limit: "10" };

            await getMyFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.getMyFeedbacks).toHaveBeenCalledWith(mockReq.userId, 1, 10);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockFeedbacks,
                message: "Your feedbacks retrieved successfully",
                pagination: mockPagination,
            });
        });

        it("should use default pagination values", async () => {
            (feedbackService.getMyFeedbacks as jest.Mock).mockResolvedValue({
                feedbacks: [],
                pagination: {},
            });

            mockReq.query = {}; // No pagination params

            await getMyFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.getMyFeedbacks).toHaveBeenCalledWith(mockReq.userId, 1, 10);
        });
    });

    // ====================================
    // GET FEEDBACKS BY TARGET TESTS
    // ====================================
    describe("getFeedbacksByTargetHandler", () => {
        it("should get feedbacks for a target (admin only)", async () => {
            const targetId = new mongoose.Types.ObjectId().toString();
            const mockFeedbacks = [
                { _id: "1", description: "Feedback 1", rating: 5 },
                { _id: "2", description: "Feedback 2", rating: 4 },
            ];
            const mockPagination = { total: 2, page: 1, limit: 10, totalPages: 1 };

            (feedbackSchemas.targetIdSchema.parse as jest.Mock).mockReturnValue({ targetId });
            (feedbackService.getFeedbacksByTarget as jest.Mock).mockResolvedValue({
                feedbacks: mockFeedbacks,
                averageRating: 4.5,
                pagination: mockPagination,
            });

            mockReq.role = Role.ADMIN;
            mockReq.params = { targetId };
            mockReq.query = { page: "1", limit: "10" };

            await getFeedbacksByTargetHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.getFeedbacksByTarget).toHaveBeenCalledWith(
                targetId,
                mockReq.userId,
                Role.ADMIN,
                1,
                10
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: mockFeedbacks,
                message: "Target feedbacks retrieved successfully",
                averageRating: 4.5,
                pagination: mockPagination,
            });
        });

        it("should handle non-admin access attempt", async () => {
            const targetId = new mongoose.Types.ObjectId().toString();
            const error = new Error("Only administrators can view all feedbacks");

            (feedbackSchemas.targetIdSchema.parse as jest.Mock).mockReturnValue({ targetId });
            (feedbackService.getFeedbacksByTarget as jest.Mock).mockRejectedValue(error);

            mockReq.role = Role.STUDENT;
            mockReq.params = { targetId };

            await getFeedbacksByTargetHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // DELETE FEEDBACK TESTS
    // ====================================
    describe("deleteFeedbackHandler", () => {
        it("should delete feedback successfully as admin", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const mockResult = {
                message: "Feedback deleted successfully",
            };

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.deleteFeedback as jest.Mock).mockResolvedValue(mockResult);

            mockReq.role = Role.ADMIN;
            mockReq.params = { id: feedbackId };

            await deleteFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(
                feedbackId,
                mockReq.userId,
                Role.ADMIN
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                data: null,
                message: mockResult.message,
            });
        });

        it("should delete own feedback as regular user", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const mockResult = {
                message: "Feedback deleted successfully",
            };

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.deleteFeedback as jest.Mock).mockResolvedValue(mockResult);

            mockReq.params = { id: feedbackId };

            await deleteFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(
                feedbackId,
                mockReq.userId,
                Role.STUDENT
            );
        });

        it("should handle permission denied error", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const error = new Error("You can only delete your own feedbacks");

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.deleteFeedback as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: feedbackId };

            await deleteFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it("should handle feedback not found error", async () => {
            const feedbackId = new mongoose.Types.ObjectId().toString();
            const error = new Error("Feedback not found");

            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.deleteFeedback as jest.Mock).mockRejectedValue(error);

            mockReq.params = { id: feedbackId };

            await deleteFeedbackHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // ERROR HANDLING TESTS
    // ====================================
    describe("Error Handling", () => {
        it("should handle missing userId in request", async () => {
            mockReq.userId = undefined;

            const mockFilters = { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" as const };
            (feedbackSchemas.listFeedbacksSchema.parse as jest.Mock).mockReturnValue(mockFilters);
            (feedbackService.listFeedbacks as jest.Mock).mockResolvedValue({
                feedbacks: [],
                pagination: {},
            });

            await listFeedbacksHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.listFeedbacks).toHaveBeenCalledWith(
                mockFilters,
                undefined,
                Role.STUDENT
            );
        });

        it("should handle missing role in request", async () => {
            mockReq.role = undefined;

            const feedbackId = new mongoose.Types.ObjectId().toString();
            (feedbackSchemas.feedbackIdSchema.parse as jest.Mock).mockReturnValue({ id: feedbackId });
            (feedbackService.getFeedbackById as jest.Mock).mockResolvedValue({});

            mockReq.params = { id: feedbackId };

            await getFeedbackByIdHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(feedbackService.getFeedbackById).toHaveBeenCalledWith(
                feedbackId,
                mockReq.userId,
                undefined
            );
        });
    });
});
