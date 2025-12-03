// Schedule Controller Unit Tests
import {Request, Response} from "express";
import mongoose from "mongoose";
import {Role} from "@/types";
import {ScheduleStatus} from "@/types/schedule.type";
import {ExceptionStatus, ExceptionType} from "@/types/scheduleException.type";
import {DayOfWeek} from "@/types/timeSlot.type";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/schedule.service", () => ({
    getAllTimeSlots: jest.fn(),
    createScheduleRequest: jest.fn(),
    getTeacherWeeklySchedule: jest.fn(),
    getCourseSchedule: jest.fn(),
    approveScheduleRequest: jest.fn(),
    getPendingScheduleRequests: jest.fn(),
    createScheduleException: jest.fn(),
    approveScheduleException: jest.fn(),
    getScheduleWithExceptions: jest.fn(),
    checkSlotAvailability: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/schedule.schemas", () => ({
    timeSlotFilterSchema: {
        parse: jest.fn(),
    },
    createScheduleSchema: {
        parse: jest.fn(),
    },
    teacherScheduleQuerySchema: {
        parse: jest.fn(),
    },
    teacherIdSchema: {
        parse: jest.fn(),
    },
    courseScheduleQuerySchema: {
        parse: jest.fn(),
    },
    courseIdSchema: {
        parse: jest.fn(),
    },
    scheduleIdSchema: {
        parse: jest.fn(),
    },
    approveScheduleSchema: {
        parse: jest.fn(),
    },
    createScheduleExceptionSchema: {
        parse: jest.fn(),
    },
    exceptionIdSchema: {
        parse: jest.fn(),
    },
    approveExceptionSchema: {
        parse: jest.fn(),
    },
    getScheduleRangeSchema: {
        parse: jest.fn(),
    },
    checkSlotAvailabilitySchema: {
        parse: jest.fn(),
    },
}));

// Import controller and services
import {
    getTimeSlotsHandler,
    createScheduleRequestHandler,
    getTeacherScheduleHandler,
    getCourseScheduleHandler,
    approveScheduleRequestHandler,
    getPendingRequestsHandler,
    createScheduleExceptionHandler,
    approveScheduleExceptionHandler,
    getScheduleWithExceptionsHandler,
    checkSlotAvailabilityHandler,
} from "@/controller/schedule.controller";
import * as scheduleService from "@/services/schedule.service";
import * as scheduleSchemas from "@/validators/schedule.schemas";

describe("📅 Schedule Controller Unit Tests", () => {
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: jest.Mock;
    let courseId: string;
    let teacherId: mongoose.Types.ObjectId;
    let adminId: mongoose.Types.ObjectId;
    let scheduleId: string;
    let exceptionId: string;
    let timeSlotId: string;
    let timeSlot: any;
    let schedule: any;
    let exception: any;

    beforeEach(() => {
        courseId = new mongoose.Types.ObjectId().toString();
        teacherId = new mongoose.Types.ObjectId();
        adminId = new mongoose.Types.ObjectId();
        scheduleId = new mongoose.Types.ObjectId().toString();
        exceptionId = new mongoose.Types.ObjectId().toString();
        timeSlotId = new mongoose.Types.ObjectId().toString();

        timeSlot = {
            _id: timeSlotId,
            slotName: "Slot 1",
            startTime: "08:00",
            endTime: "10:00",
            order: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        schedule = {
            _id: scheduleId,
            courseId,
            teacherId: teacherId.toString(),
            dayOfWeek: DayOfWeek.MONDAY,
            timeSlotId,
            status: ScheduleStatus.PENDING,
            approvalNote: null,
            approvedBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        exception = {
            _id: exceptionId,
            scheduleId,
            exceptionDate: new Date("2024-12-15"),
            exceptionType: ExceptionType.CANCELLATION,
            reason: "Teacher is sick",
            replacementTeacherId: null,
            status: ExceptionStatus.PENDING,
            requestedBy: teacherId.toString(),
            approvedBy: null,
            approvalNote: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockReq = {
            query: {},
            params: {},
            body: {},
            userId: teacherId,
            role: Role.TEACHER,
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
    // TIME SLOT HANDLER TESTS
    // ====================================
    describe("getTimeSlotsHandler", () => {
        it("should get all time slots without filter", async () => {
            const mockSlots = [timeSlot];
            mockReq.query = {};
            (scheduleSchemas.timeSlotFilterSchema.parse as jest.Mock).mockReturnValue({});
            (scheduleService.getAllTimeSlots as jest.Mock).mockResolvedValue(mockSlots);

            await getTimeSlotsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.getAllTimeSlots).toHaveBeenCalledWith({});
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Time slots retrieved successfully",
                data: mockSlots,
            });
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            (scheduleSchemas.timeSlotFilterSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await getTimeSlotsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });
    });

    // ====================================
    // SCHEDULE REQUEST HANDLER TESTS
    // ====================================
    describe("createScheduleRequestHandler", () => {
        it("should create a schedule request with single slot", async () => {
            const scheduleData = {
                courseId,
                slots: [
                    {
                        dayOfWeek: DayOfWeek.MONDAY,
                        timeSlotId,
                    },
                ],
            };
            const mockCreatedSchedules = [schedule];

            mockReq.body = scheduleData;
            (scheduleSchemas.createScheduleSchema.parse as jest.Mock).mockReturnValue(scheduleData);
            (scheduleService.createScheduleRequest as jest.Mock).mockResolvedValue(mockCreatedSchedules);

            await createScheduleRequestHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.createScheduleRequest).toHaveBeenCalledWith({
                ...scheduleData,
                teacherId,
            });
            expect(mockRes.success).toHaveBeenCalledWith(201, {
                message: "Schedule request created successfully with 1 slot",
                data: mockCreatedSchedules,
            });
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            (scheduleSchemas.createScheduleSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await createScheduleRequestHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });
    });

    // ====================================
    // TEACHER SCHEDULE HANDLER TESTS
    // ====================================
    describe("getTeacherScheduleHandler", () => {
        it("should get teacher schedule with date and status", async () => {
            const date = "2024-12-01";
            const status = ScheduleStatus.APPROVED;
            const mockSchedule = {
                teacher: {_id: teacherId, fullname: "John Doe"},
                schedule: [schedule],
                weekRange: {start: new Date(), end: new Date()},
            };

            mockReq.params = {teacherId: teacherId.toString()};
            mockReq.query = {date, status};
            (scheduleSchemas.teacherIdSchema.parse as jest.Mock).mockReturnValue(teacherId.toString());
            (scheduleSchemas.teacherScheduleQuerySchema.parse as jest.Mock).mockReturnValue({date, status});
            (scheduleService.getTeacherWeeklySchedule as jest.Mock).mockResolvedValue(mockSchedule);

            await getTeacherScheduleHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.getTeacherWeeklySchedule).toHaveBeenCalledWith(teacherId.toString(), date, status);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Teacher schedule retrieved successfully",
                data: mockSchedule,
            });
        });

        it("should handle validation errors for invalid teacherId", async () => {
            const validationError = new Error("Invalid teacher ID");
            mockReq.params = {teacherId: "invalid"};
            (scheduleSchemas.teacherIdSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await getTeacherScheduleHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });
    });

    // ====================================
    // COURSE SCHEDULE HANDLER TESTS
    // ====================================
    describe("getCourseScheduleHandler", () => {
        it("should get course schedule with status filter", async () => {
            const status = ScheduleStatus.APPROVED;
            const mockSchedule = {
                course: {_id: courseId, title: "Mathematics 101"},
                schedule: [schedule],
            };

            mockReq.params = {courseId};
            mockReq.query = {status};
            (scheduleSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
            (scheduleSchemas.courseScheduleQuerySchema.parse as jest.Mock).mockReturnValue({status});
            (scheduleService.getCourseSchedule as jest.Mock).mockResolvedValue(mockSchedule);

            await getCourseScheduleHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.getCourseSchedule).toHaveBeenCalledWith(courseId, status);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Course schedule retrieved successfully",
                data: mockSchedule,
            });
        });
    });

    // ====================================
    // APPROVE SCHEDULE REQUEST HANDLER TESTS
    // ====================================
    describe("approveScheduleRequestHandler", () => {
        it("should approve schedule request successfully", async () => {
            const approvalData = {
                approved: true,
                approvalNote: "Approved",
            };
            const approvedSchedule = {
                ...schedule,
                status: ScheduleStatus.APPROVED,
                approvedBy: adminId.toString(),
                approvalNote: approvalData.approvalNote,
            };

            mockReq.params = {scheduleId};
            mockReq.body = approvalData;
            mockReq.userId = adminId;
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.approveScheduleSchema.parse as jest.Mock).mockReturnValue(approvalData);
            (scheduleService.approveScheduleRequest as jest.Mock).mockResolvedValue(approvedSchedule);

            await approveScheduleRequestHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.approveScheduleRequest).toHaveBeenCalledWith(
                scheduleId,
                approvalData.approved,
                adminId,
                approvalData.approvalNote
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Schedule approved successfully",
                data: approvedSchedule,
            });
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            mockReq.params = {scheduleId: "invalid"};
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await approveScheduleRequestHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });
    });

    // ====================================
    // PENDING REQUESTS HANDLER TESTS
    // ====================================
    describe("getPendingRequestsHandler", () => {
        it("should get all pending schedule requests", async () => {
            const mockRequests = [schedule, {...schedule, _id: new mongoose.Types.ObjectId().toString()}];
            (scheduleService.getPendingScheduleRequests as jest.Mock).mockResolvedValue(mockRequests);

            await getPendingRequestsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.getPendingScheduleRequests).toHaveBeenCalled();
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Pending requests retrieved successfully",
                data: mockRequests,
            });
        });
    });

    // ====================================
    // CREATE SCHEDULE EXCEPTION HANDLER TESTS
    // ====================================
    describe("createScheduleExceptionHandler", () => {
        it("should create cancellation exception", async () => {
            const exceptionData = {
                exceptionDate: new Date("2024-12-15"),
                exceptionType: ExceptionType.CANCELLATION,
                reason: "Teacher is sick",
            };
            const createdException = {
                ...exception,
                exceptionType: ExceptionType.CANCELLATION,
            };

            mockReq.params = {scheduleId};
            mockReq.body = exceptionData;
            mockReq.userId = teacherId;
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.createScheduleExceptionSchema.parse as jest.Mock).mockReturnValue(exceptionData);
            (scheduleService.createScheduleException as jest.Mock).mockResolvedValue(createdException);

            await createScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.createScheduleException).toHaveBeenCalledWith({
                scheduleId,
                ...exceptionData,
                replacementTeacherId: undefined,
                requestedBy: teacherId,
            });
            expect(mockRes.success).toHaveBeenCalledWith(201, {
                message: "Exception created successfully",
                data: createdException,
            });
        });

        it("should create replacement exception with replacement teacher", async () => {
            const replacementTeacherId = new mongoose.Types.ObjectId();
            const exceptionData = {
                exceptionDate: new Date("2024-12-15"),
                exceptionType: ExceptionType.REPLACEMENT,
                reason: "Teacher has conference",
                replacementTeacherId,
            };
            const createdException = {
                ...exception,
                exceptionType: ExceptionType.REPLACEMENT,
                replacementTeacherId,
            };

            mockReq.params = {scheduleId};
            mockReq.body = exceptionData;
            mockReq.userId = teacherId;
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.createScheduleExceptionSchema.parse as jest.Mock).mockReturnValue(exceptionData);
            (scheduleService.createScheduleException as jest.Mock).mockResolvedValue(createdException);

            await createScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.createScheduleException).toHaveBeenCalledWith({
                scheduleId,
                ...exceptionData,
                replacementTeacherId,
                requestedBy: teacherId,
            });
            expect(mockRes.success).toHaveBeenCalledWith(201, {
                message: "Exception created successfully",
                data: createdException,
            });
        });

        it("should use current user's ID as requestedBy", async () => {
            const exceptionData = {
                exceptionDate: new Date("2024-12-15"),
                exceptionType: ExceptionType.CANCELLATION,
                reason: "Emergency",
            };
            mockReq.params = {scheduleId};
            mockReq.body = exceptionData;
            mockReq.userId = teacherId;
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.createScheduleExceptionSchema.parse as jest.Mock).mockReturnValue(exceptionData);
            (scheduleService.createScheduleException as jest.Mock).mockResolvedValue(exception);

            await createScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.createScheduleException).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestedBy: teacherId,
                })
            );
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            mockReq.params = {scheduleId};
            mockReq.body = {};
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.createScheduleExceptionSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await createScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const error = new Error("Schedule not found");
            const exceptionData = {
                exceptionDate: new Date("2024-12-15"),
                exceptionType: ExceptionType.CANCELLATION,
                reason: "Test",
            };
            mockReq.params = {scheduleId};
            mockReq.body = exceptionData;
            mockReq.userId = teacherId;
            (scheduleSchemas.scheduleIdSchema.parse as jest.Mock).mockReturnValue(scheduleId);
            (scheduleSchemas.createScheduleExceptionSchema.parse as jest.Mock).mockReturnValue(exceptionData);
            (scheduleService.createScheduleException as jest.Mock).mockRejectedValue(error);

            await createScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // APPROVE SCHEDULE EXCEPTION HANDLER TESTS
    // ====================================
    describe("approveScheduleExceptionHandler", () => {
        it("should approve schedule exception successfully", async () => {
            const approvalData = {
                approved: true,
                approvalNote: "Exception approved",
            };
            const approvedException = {
                ...exception,
                status: ExceptionStatus.APPROVED,
                approvedBy: adminId.toString(),
                approvalNote: approvalData.approvalNote,
            };

            mockReq.params = {exceptionId};
            mockReq.body = approvalData;
            mockReq.userId = adminId;
            (scheduleSchemas.exceptionIdSchema.parse as jest.Mock).mockReturnValue(exceptionId);
            (scheduleSchemas.approveExceptionSchema.parse as jest.Mock).mockReturnValue(approvalData);
            (scheduleService.approveScheduleException as jest.Mock).mockResolvedValue(approvedException);

            await approveScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.approveScheduleException).toHaveBeenCalledWith(
                exceptionId,
                approvalData.approved,
                adminId,
                approvalData.approvalNote
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Exception approved successfully",
                data: approvedException,
            });
        });

        it("should reject schedule exception successfully", async () => {
            const approvalData = {
                approved: false,
                approvalNote: "No valid replacement teacher",
            };
            const rejectedException = {
                ...exception,
                status: ExceptionStatus.REJECTED,
                approvedBy: adminId.toString(),
                approvalNote: approvalData.approvalNote,
            };

            mockReq.params = {exceptionId};
            mockReq.body = approvalData;
            mockReq.userId = adminId;
            (scheduleSchemas.exceptionIdSchema.parse as jest.Mock).mockReturnValue(exceptionId);
            (scheduleSchemas.approveExceptionSchema.parse as jest.Mock).mockReturnValue(approvalData);
            (scheduleService.approveScheduleException as jest.Mock).mockResolvedValue(rejectedException);

            await approveScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.approveScheduleException).toHaveBeenCalledWith(
                exceptionId,
                approvalData.approved,
                adminId,
                approvalData.approvalNote
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Exception rejected successfully",
                data: rejectedException,
            });
        });

        it("should approve without approval note", async () => {
            const approvalData = {
                approved: true,
            };
            const approvedException = {
                ...exception,
                status: ExceptionStatus.APPROVED,
                approvedBy: adminId.toString(),
            };

            mockReq.params = {exceptionId};
            mockReq.body = approvalData;
            mockReq.userId = adminId;
            (scheduleSchemas.exceptionIdSchema.parse as jest.Mock).mockReturnValue(exceptionId);
            (scheduleSchemas.approveExceptionSchema.parse as jest.Mock).mockReturnValue(approvalData);
            (scheduleService.approveScheduleException as jest.Mock).mockResolvedValue(approvedException);

            await approveScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.approveScheduleException).toHaveBeenCalledWith(
                exceptionId,
                approvalData.approved,
                adminId,
                undefined
            );
        });

        it("should handle validation errors", async () => {
            const validationError = new Error("Validation failed");
            mockReq.params = {exceptionId: "invalid"};
            (scheduleSchemas.exceptionIdSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await approveScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const error = new Error("Exception not found");
            const approvalData = {approved: true};
            mockReq.params = {exceptionId};
            mockReq.body = approvalData;
            mockReq.userId = adminId;
            (scheduleSchemas.exceptionIdSchema.parse as jest.Mock).mockReturnValue(exceptionId);
            (scheduleSchemas.approveExceptionSchema.parse as jest.Mock).mockReturnValue(approvalData);
            (scheduleService.approveScheduleException as jest.Mock).mockRejectedValue(error);

            await approveScheduleExceptionHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // GET SCHEDULE WITH EXCEPTIONS HANDLER TESTS
    // ====================================
    describe("getScheduleWithExceptionsHandler", () => {
        it("should get schedule with exceptions for date range", async () => {
            const startDate = "2024-12-01";
            const endDate = "2024-12-31";
            const mockScheduleData = {
                course: {_id: courseId, title: "Mathematics 101"},
                schedule: [
                    {
                        ...schedule,
                        exceptions: [exception],
                    },
                ],
            };

            mockReq.params = {courseId};
            mockReq.query = {startDate, endDate};
            (scheduleSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
            (scheduleSchemas.getScheduleRangeSchema.parse as jest.Mock).mockReturnValue({startDate, endDate});
            (scheduleService.getScheduleWithExceptions as jest.Mock).mockResolvedValue(mockScheduleData);

            await getScheduleWithExceptionsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.getScheduleWithExceptions).toHaveBeenCalledWith(courseId, startDate, endDate);
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Schedule with exceptions retrieved successfully",
                data: mockScheduleData,
            });
        });

        it("should handle validation errors for missing date range", async () => {
            const validationError = new Error("startDate and endDate are required");
            mockReq.params = {courseId};
            mockReq.query = {};
            (scheduleSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
            (scheduleSchemas.getScheduleRangeSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await getScheduleWithExceptionsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle validation errors for invalid courseId", async () => {
            const validationError = new Error("Invalid course ID");
            mockReq.params = {courseId: "invalid"};
            (scheduleSchemas.courseIdSchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await getScheduleWithExceptionsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const error = new Error("Course not found");
            const startDate = "2024-12-01";
            const endDate = "2024-12-31";
            mockReq.params = {courseId};
            mockReq.query = {startDate, endDate};
            (scheduleSchemas.courseIdSchema.parse as jest.Mock).mockReturnValue(courseId);
            (scheduleSchemas.getScheduleRangeSchema.parse as jest.Mock).mockReturnValue({startDate, endDate});
            (scheduleService.getScheduleWithExceptions as jest.Mock).mockRejectedValue(error);

            await getScheduleWithExceptionsHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // ====================================
    // CHECK SLOT AVAILABILITY HANDLER TESTS
    // ====================================
    describe("checkSlotAvailabilityHandler", () => {
        it("should return available slot", async () => {
            const queryData = {
                teacherId: teacherId.toString(),
                dayOfWeek: DayOfWeek.MONDAY,
                timeSlotId,
            };

            mockReq.query = queryData;
            (scheduleSchemas.checkSlotAvailabilitySchema.parse as jest.Mock).mockReturnValue(queryData);
            (scheduleService.checkSlotAvailability as jest.Mock).mockResolvedValue(true);

            await checkSlotAvailabilityHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.checkSlotAvailability).toHaveBeenCalledWith(
                queryData.teacherId,
                queryData.dayOfWeek,
                queryData.timeSlotId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Slot is available",
                data: {available: true},
            });
        });

        it("should return unavailable slot", async () => {
            const queryData = {
                teacherId: teacherId.toString(),
                dayOfWeek: DayOfWeek.MONDAY,
                timeSlotId,
            };

            mockReq.query = queryData;
            (scheduleSchemas.checkSlotAvailabilitySchema.parse as jest.Mock).mockReturnValue(queryData);
            (scheduleService.checkSlotAvailability as jest.Mock).mockResolvedValue(false);

            await checkSlotAvailabilityHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(scheduleService.checkSlotAvailability).toHaveBeenCalledWith(
                queryData.teacherId,
                queryData.dayOfWeek,
                queryData.timeSlotId
            );
            expect(mockRes.success).toHaveBeenCalledWith(200, {
                message: "Slot is already booked",
                data: {available: false},
            });
        });

        it("should handle validation errors for missing parameters", async () => {
            const validationError = new Error("Required parameters missing");
            mockReq.query = {};
            (scheduleSchemas.checkSlotAvailabilitySchema.parse as jest.Mock).mockImplementation(() => {
                throw validationError;
            });

            await checkSlotAvailabilityHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(validationError);
        });

        it("should handle service errors", async () => {
            const error = new Error("Teacher not found");
            const queryData = {
                teacherId: teacherId.toString(),
                dayOfWeek: DayOfWeek.MONDAY,
                timeSlotId,
            };
            mockReq.query = queryData;
            (scheduleSchemas.checkSlotAvailabilitySchema.parse as jest.Mock).mockReturnValue(queryData);
            (scheduleService.checkSlotAvailability as jest.Mock).mockRejectedValue(error);

            await checkSlotAvailabilityHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});

