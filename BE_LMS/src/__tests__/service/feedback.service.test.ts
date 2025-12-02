// Feedback Service Unit Tests
import mongoose from "mongoose";
import { Role } from "@/types";
import { FeedbackType } from "@/types/feedback.type";

// Mock all dependencies before importing services
jest.mock("@/models/feedback.model");
jest.mock("@/models/user.model");
jest.mock("@/models/course.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/uploadFile", () => ({
    uploadFile: jest.fn().mockResolvedValue({
        publicUrl: "http://test.com/file.pdf",
        key: "test-key",
        originalName: "file.pdf",
        mimeType: "application/pdf",
        size: 1024,
    }),
    removeFile: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/services/helpers/notification.helper", () => ({
    notifyNewSystemFeedback: jest.fn().mockResolvedValue(undefined),
    notifyTeacherFeedback: jest.fn().mockResolvedValue(undefined),
    notifyCourseFeedback: jest.fn().mockResolvedValue(undefined),
}));

// Import models and utilities
import { FeedbackModel, UserModel, CourseModel } from "@/models";
import appAssert from "@/utils/appAssert";
import { uploadFile, removeFile } from "@/utils/uploadFile";
import {
    notifyNewSystemFeedback,
    notifyTeacherFeedback,
    notifyCourseFeedback,
} from "@/services/helpers/notification.helper";

// Import services
import {
    createFeedback,
    listFeedbacks,
    getFeedbackById,
    getMyFeedbacks,
    getFeedbacksByTarget,
    deleteFeedback,
} from "@/services/feedback.service";

describe("💬 Feedback Service Unit Tests", () => {
    let adminUser: any;
    let teacherUser: any;
    let studentUser: any;
    let course: any;
    let feedback: any;

    beforeEach(() => {
        // Create mock data
        adminUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "admin_test",
            email: "admin@test.com",
            fullname: "Admin Test",
            role: Role.ADMIN,
        };

        teacherUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "teacher_test",
            email: "teacher@test.com",
            fullname: "Teacher Test",
            role: Role.TEACHER,
        };

        studentUser = {
            _id: new mongoose.Types.ObjectId(),
            username: "student_test",
            email: "student@test.com",
            fullname: "Student Test",
            role: Role.STUDENT,
        };

        course = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Course",
            teacherIds: [teacherUser._id],
        };

        feedback = {
            _id: new mongoose.Types.ObjectId(),
            userId: studentUser._id,
            type: FeedbackType.SYSTEM,
            description: "Test feedback",
            rating: 5,
            createdAt: new Date(),
        };

        // Reset all mocks
        jest.clearAllMocks();

        // Reset uploadFile and removeFile to default implementations
        (uploadFile as jest.Mock).mockResolvedValue({
            publicUrl: "http://test.com/file.pdf",
            key: "test-key",
            originalName: "file.pdf",
            mimeType: "application/pdf",
            size: 1024,
        });
        (removeFile as jest.Mock).mockResolvedValue(undefined);

        // appAssert: throw Error(message) when condition falsy
        (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
            if (!condition) throw new Error(message);
        });
    });

    // ====================================
    // CREATE FEEDBACK TESTS
    // ====================================
    describe("createFeedback", () => {
        it("should create system feedback successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const mockCreatedFeedback = {
                ...feedback,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(feedback),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const data = {
                type: FeedbackType.SYSTEM,
                title: "System Feedback",
                description: "System is great!",
                rating: 5,
            };

            const result = await createFeedback(data, studentUser._id);

            expect(result).toBeDefined();
            expect(FeedbackModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...data,
                    userId: studentUser._id,
                })
            );
            expect(notifyNewSystemFeedback).toHaveBeenCalled();
        });

        it("should create teacher feedback successfully", async () => {
            (UserModel.findById as jest.Mock)
                .mockResolvedValueOnce(studentUser) // For user validation
                .mockResolvedValueOnce(teacherUser); // For target validation

            const teacherFeedbackData = {
                type: FeedbackType.TEACHER,
                title: "Teacher Feedback",
                targetId: teacherUser._id.toString(),
                description: "Great teacher!",
                rating: 5,
            };

            const mockCreatedFeedback = {
                ...feedback,
                ...teacherFeedbackData,
                populate: jest.fn().mockResolvedValue({ ...feedback, ...teacherFeedbackData }),
                save: jest.fn().mockResolvedValue({ ...feedback, ...teacherFeedbackData }),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const result = await createFeedback(teacherFeedbackData, studentUser._id);

            expect(result).toBeDefined();
            expect(notifyTeacherFeedback).toHaveBeenCalledWith(
                teacherUser._id.toString(),
                teacherFeedbackData.description,
                teacherFeedbackData.rating,
                studentUser.fullname
            );
        });

        it("should create course feedback successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);

            const mockCreatedFeedback = {
                ...feedback,
                type: FeedbackType.OTHER,
                targetId: course._id,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(feedback),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const data = {
                type: FeedbackType.OTHER,
                title: "Course Feedback",
                targetId: course._id.toString(),
                description: "Great course!",
                rating: 5,
            };

            const result = await createFeedback(data, studentUser._id);

            expect(result).toBeDefined();
            expect(notifyCourseFeedback).toHaveBeenCalled();
        });

        it("should create feedback with file attachment", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const mockCreatedFeedback = {
                ...feedback,
                _id: new mongoose.Types.ObjectId(),
                originalName: undefined,
                mimeType: undefined,
                key: undefined,
                size: undefined,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(true),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const data = {
                type: FeedbackType.SYSTEM,
                title: "Feedback with File",
                description: "Feedback with file",
                rating: 4,
            };

            const mockFile = {
                originalname: "test.pdf",
                buffer: Buffer.from("test"),
            } as Express.Multer.File;

            const result = await createFeedback(data, studentUser._id, mockFile);

            expect(uploadFile).toHaveBeenCalled();
            expect(mockCreatedFeedback.save).toHaveBeenCalled();
            expect(mockCreatedFeedback.key).toBe("test-key");
        });

        it("should rollback feedback if file upload fails", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const mockId = new mongoose.Types.ObjectId();
            const mockCreatedFeedback = {
                ...feedback,
                _id: mockId,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockRejectedValue(new Error("Save failed")),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);
            (uploadFile as jest.Mock).mockRejectedValueOnce(new Error("Upload failed"));
            (FeedbackModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const data = {
                type: FeedbackType.SYSTEM,
                title: "Test Feedback",
                description: "Test",
                rating: 5,
            };

            const mockFile = {
                originalname: "test.pdf",
                buffer: Buffer.from("test"),
            } as Express.Multer.File;

            await expect(createFeedback(data, studentUser._id, mockFile)).rejects.toThrow();

            expect(FeedbackModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
        });

        it("should throw error when user not found", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            const data = {
                type: FeedbackType.SYSTEM,
                title: "Test Feedback",
                description: "Test",
                rating: 5,
            };

            await expect(createFeedback(data, studentUser._id)).rejects.toThrow("User not found");
        });

        it("should throw error when target teacher not found", async () => {
            (UserModel.findById as jest.Mock)
                .mockResolvedValueOnce(studentUser)
                .mockResolvedValueOnce(null);

            const data = {
                type: FeedbackType.TEACHER,
                title: "Teacher Feedback",
                targetId: new mongoose.Types.ObjectId().toString(),
                description: "Test",
                rating: 5,
            };

            await expect(createFeedback(data, studentUser._id)).rejects.toThrow("Target user not found");
        });

        it("should throw error when target is not a teacher or admin", async () => {
            (UserModel.findById as jest.Mock)
                .mockResolvedValueOnce(studentUser)
                .mockResolvedValueOnce({ ...studentUser, role: Role.STUDENT }); // Target is student

            const data = {
                type: FeedbackType.TEACHER,
                title: "Teacher Feedback",
                targetId: studentUser._id.toString(),
                description: "Test",
                rating: 5,
            };

            await expect(createFeedback(data, studentUser._id)).rejects.toThrow(
                "Target must be a teacher or admin"
            );
        });

        it("should not fail if notification sending fails", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const mockCreatedFeedback = {
                ...feedback,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(feedback),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);
            (notifyNewSystemFeedback as jest.Mock).mockRejectedValueOnce(new Error("Notification failed"));

            const data = {
                type: FeedbackType.SYSTEM,
                title: "Test Feedback",
                description: "Test",
                rating: 5,
            };

            // Should not throw error
            const result = await createFeedback(data, studentUser._id);
            expect(result).toBeDefined();
        });

        it("should not send course notification when targetId is not a course (OTHER type)", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);
            (CourseModel.findById as jest.Mock).mockResolvedValue(null); // Not a course

            const mockCreatedFeedback = {
                ...feedback,
                type: FeedbackType.OTHER,
                targetId: new mongoose.Types.ObjectId(),
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(feedback),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            const data = {
                type: FeedbackType.OTHER,
                title: "Other Feedback",
                targetId: new mongoose.Types.ObjectId().toString(),
                description: "Some feedback",
                rating: 4,
            };

            const result = await createFeedback(data, studentUser._id);

            expect(result).toBeDefined();
            // notifyCourseFeedback should NOT be called since targetId is not a course
            expect(notifyCourseFeedback).not.toHaveBeenCalled();
        });

        it("should handle file upload with undefined mimeType", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(studentUser);

            const mockCreatedFeedback = {
                ...feedback,
                _id: new mongoose.Types.ObjectId(),
                originalName: undefined,
                mimeType: undefined,
                key: undefined,
                size: undefined,
                populate: jest.fn().mockResolvedValue(feedback),
                save: jest.fn().mockResolvedValue(true),
            };
            (FeedbackModel.create as jest.Mock).mockResolvedValue(mockCreatedFeedback);

            // Mock uploadFile to return undefined mimeType
            (uploadFile as jest.Mock).mockResolvedValueOnce({
                publicUrl: "http://test.com/file.pdf",
                key: "test-key",
                originalName: "file.pdf",
                mimeType: undefined, // Edge case
                size: 1024,
            });

            const data = {
                type: FeedbackType.SYSTEM,
                title: "Feedback with File",
                description: "Feedback with file",
                rating: 4,
            };

            const mockFile = {
                originalname: "test.pdf",
                buffer: Buffer.from("test"),
            } as Express.Multer.File;

            const result = await createFeedback(data, studentUser._id, mockFile);

            expect(uploadFile).toHaveBeenCalled();
            expect(mockCreatedFeedback.save).toHaveBeenCalled();
            expect(mockCreatedFeedback.mimeType).toBeUndefined();
        });
    });

    // ====================================
    // LIST FEEDBACKS TESTS
    // ====================================
    describe("listFeedbacks", () => {
        it("should list feedbacks for admin with pagination", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            const result = await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(result).toBeDefined();
            expect(result.feedbacks).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
        });

        it("should only show own feedbacks for non-admin users", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, studentUser._id, Role.STUDENT);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: studentUser._id,
                })
            );
        });

        it("should filter feedbacks by type", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([{ avgRating: 4.5 }]);

            const filters = {
                page: 1,
                limit: 10,
                type: FeedbackType.SYSTEM,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            const result = await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: FeedbackType.SYSTEM,
                })
            );
            expect(result.averageRating).toBe(4.5);
        });

        it("should filter feedbacks by rating range", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                minRating: 4,
                maxRating: 5,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: { $gte: 4, $lte: 5 },
                })
            );
        });

        it("should filter feedbacks by date range", async () => {
            const from = new Date("2024-01-01");
            const to = new Date("2024-12-31");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                from,
                to,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $gte: from, $lte: to },
                })
            );
        });

        it("should calculate average rating when filtering by targetId", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([{ avgRating: 4.5 }]);

            const filters = {
                page: 1,
                limit: 10,
                targetId: teacherUser._id.toString(),
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            const result = await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(result.averageRating).toBe(4.5);
            expect(FeedbackModel.aggregate).toHaveBeenCalled();
        });

        it("should return 0 average rating when no stats returned for type filter", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([]); // Empty stats

            const filters = {
                page: 1,
                limit: 10,
                type: FeedbackType.SYSTEM,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            const result = await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(result.averageRating).toBe(0);
        });

        it("should filter by userId when admin specifies filterUserId", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                userId: studentUser._id.toString(),
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: studentUser._id.toString(),
                })
            );
        });

        it("should filter by minRating only", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                minRating: 4,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: { $gte: 4 },
                })
            );
        });

        it("should filter by maxRating only", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                maxRating: 3,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    rating: { $lte: 3 },
                })
            );
        });

        it("should filter by from date only", async () => {
            const from = new Date("2024-01-01");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                from,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $gte: from },
                })
            );
        });

        it("should filter by to date only", async () => {
            const to = new Date("2024-12-31");

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                to,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(FeedbackModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: { $lte: to },
                })
            );
        });

        it("should not include averageRating when no type or targetId filter", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const filters = {
                page: 1,
                limit: 10,
                sortBy: "createdAt" as const,
                sortOrder: "desc" as const,
            };

            const result = await listFeedbacks(filters, adminUser._id, Role.ADMIN);

            expect(result.averageRating).toBeUndefined();
            expect(FeedbackModel.aggregate).not.toHaveBeenCalled();
        });
    });

    // ====================================
    // GET FEEDBACK BY ID TESTS
    // ====================================
    describe("getFeedbackById", () => {
        it("should get feedback by ID for admin", async () => {
            const mockFeedback = {
                ...feedback,
                userId: { _id: studentUser._id },
            };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockFeedback),
            };
            (FeedbackModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await getFeedbackById(feedback._id.toString(), adminUser._id, Role.ADMIN);

            expect(result).toBeDefined();
            expect(result._id).toBe(feedback._id);
        });

        it("should allow user to view own feedback", async () => {
            const mockFeedback = {
                ...feedback,
                userId: { _id: studentUser._id, equals: (id: any) => id.equals(studentUser._id) },
            };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockFeedback),
            };
            (FeedbackModel.findById as jest.Mock).mockReturnValue(mockQuery);

            const result = await getFeedbackById(feedback._id.toString(), studentUser._id, Role.STUDENT);

            expect(result).toBeDefined();
        });

        it("should throw error when user tries to view other's feedback", async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const mockFeedback = {
                ...feedback,
                userId: { _id: otherUserId, equals: (id: any) => id.equals(otherUserId) },
            };
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockFeedback),
            };
            (FeedbackModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(
                getFeedbackById(feedback._id.toString(), studentUser._id, Role.STUDENT)
            ).rejects.toThrow("You can only view your own feedbacks");
        });

        it("should throw error when feedback not found", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(null),
            };
            (FeedbackModel.findById as jest.Mock).mockReturnValue(mockQuery);

            await expect(
                getFeedbackById(feedback._id.toString(), adminUser._id, Role.ADMIN)
            ).rejects.toThrow("Feedback not found");
        });
    });

    // ====================================
    // GET MY FEEDBACKS TESTS
    // ====================================
    describe("getMyFeedbacks", () => {
        it("should get user's own feedbacks with pagination", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);

            const result = await getMyFeedbacks(studentUser._id, 1, 10);

            expect(result).toBeDefined();
            expect(result.feedbacks).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(FeedbackModel.find).toHaveBeenCalledWith({ userId: studentUser._id });
        });
    });

    // ====================================
    // GET FEEDBACKS BY TARGET TESTS
    // ====================================
    describe("getFeedbacksByTarget", () => {
        it("should allow admin to view feedbacks for a target", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([{ avgRating: 4.5 }]);

            const result = await getFeedbacksByTarget(
                teacherUser._id.toString(),
                adminUser._id,
                Role.ADMIN,
                1,
                10
            );

            expect(result).toBeDefined();
            expect(result.feedbacks).toHaveLength(1);
            expect(result.averageRating).toBe(4.5);
        });

        it("should reject non-admin from viewing target feedbacks", async () => {
            await expect(
                getFeedbacksByTarget(teacherUser._id.toString(), studentUser._id, Role.STUDENT, 1, 10)
            ).rejects.toThrow("Only administrators can view all feedbacks");
        });

        it("should calculate average rating correctly", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([feedback]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(1);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([{ avgRating: 4.567 }]);

            const result = await getFeedbacksByTarget(
                teacherUser._id.toString(),
                adminUser._id,
                Role.ADMIN,
                1,
                10
            );

            // Should be rounded to 1 decimal
            expect(result.averageRating).toBe(4.6);
        });

        it("should return 0 average rating when no feedbacks", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([]),
            };
            (FeedbackModel.find as jest.Mock).mockReturnValue(mockQuery);
            (FeedbackModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (FeedbackModel.aggregate as jest.Mock).mockResolvedValue([]);

            const result = await getFeedbacksByTarget(
                teacherUser._id.toString(),
                adminUser._id,
                Role.ADMIN,
                1,
                10
            );

            expect(result.averageRating).toBe(0);
        });
    });

    // ====================================
    // DELETE FEEDBACK TESTS
    // ====================================
    describe("deleteFeedback", () => {
        it("should allow admin to delete any feedback", async () => {
            const mockFeedback = {
                ...feedback,
                userId: studentUser._id,
                key: "test-file-key",
            };
            (FeedbackModel.findById as jest.Mock).mockResolvedValue(mockFeedback);
            (FeedbackModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockFeedback);

            const result = await deleteFeedback(feedback._id.toString(), adminUser._id, Role.ADMIN);

            expect(result.message).toContain("deleted successfully");
            expect(removeFile).toHaveBeenCalledWith("test-file-key");
            expect(FeedbackModel.findByIdAndDelete).toHaveBeenCalledWith(feedback._id.toString());
        });

        it("should allow user to delete own feedback", async () => {
            const mockFeedback = {
                ...feedback,
                userId: studentUser._id,
            };
            (mockFeedback.userId as any).equals = jest.fn().mockReturnValue(true);

            (FeedbackModel.findById as jest.Mock).mockResolvedValue(mockFeedback);
            (FeedbackModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockFeedback);

            const result = await deleteFeedback(feedback._id.toString(), studentUser._id, Role.STUDENT);

            expect(result.message).toContain("deleted successfully");
        });

        it("should reject user from deleting other's feedback", async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            const mockFeedback = {
                ...feedback,
                userId: otherUserId,
            };
            (mockFeedback.userId as any).equals = jest.fn().mockReturnValue(false);

            (FeedbackModel.findById as jest.Mock).mockResolvedValue(mockFeedback);

            await expect(
                deleteFeedback(feedback._id.toString(), studentUser._id, Role.STUDENT)
            ).rejects.toThrow("You can only delete your own feedbacks");
        });

        it("should throw error when feedback not found", async () => {
            (FeedbackModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteFeedback(feedback._id.toString(), adminUser._id, Role.ADMIN)
            ).rejects.toThrow("Feedback not found");
        });

        it("should delete feedback even if file deletion fails", async () => {
            const mockFeedback = {
                ...feedback,
                userId: adminUser._id,
                key: "test-file-key",
            };
            (FeedbackModel.findById as jest.Mock).mockResolvedValue(mockFeedback);
            (FeedbackModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockFeedback);
            (removeFile as jest.Mock).mockRejectedValueOnce(new Error("File deletion failed"));

            // Should not throw error
            const result = await deleteFeedback(feedback._id.toString(), adminUser._id, Role.ADMIN);

            expect(result.message).toContain("deleted successfully");
            expect(FeedbackModel.findByIdAndDelete).toHaveBeenCalled();
        });

        it("should not try to delete file if key is not present", async () => {
            const mockFeedback = {
                ...feedback,
                userId: adminUser._id,
                key: undefined,
            };
            (FeedbackModel.findById as jest.Mock).mockResolvedValue(mockFeedback);
            (FeedbackModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockFeedback);

            await deleteFeedback(feedback._id.toString(), adminUser._id, Role.ADMIN);

            expect(removeFile).not.toHaveBeenCalled();
        });
    });
});
