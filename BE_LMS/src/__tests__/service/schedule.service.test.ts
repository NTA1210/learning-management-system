// Schedule Service Unit Tests
import mongoose from "mongoose";
import {Role} from "@/types";
import {ScheduleStatus} from "@/types/schedule.type";
import {ExceptionStatus, ExceptionType} from "@/types/scheduleException.type";
import {DayOfWeek} from "@/types/timeSlot.type";

// Mock all models and utilities before importing services
jest.mock("@/models/schedule.model");
jest.mock("@/models/scheduleException.model");
jest.mock("@/models/timeSlot.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/utils/appAssert");

// Import models for mocking
import ScheduleModel from "@/models/schedule.model";
import ScheduleExceptionModel from "@/models/scheduleException.model";
import TimeSlotModel from "@/models/timeSlot.model";
import CourseModel from "@/models/course.model";
import UserModel from "@/models/user.model";
import appAssert from "@/utils/appAssert";

// Import services
import {
    getAllTimeSlots,
    createScheduleRequest,
    getTeacherWeeklySchedule,
    getCourseSchedule,
    approveScheduleRequest,
    getPendingScheduleRequests,
    createScheduleException,
    approveScheduleException,
    getScheduleWithExceptions,
    checkSlotAvailability,
    CreateScheduleInput,
    CreateExceptionInput,
} from "@/services/schedule.service";

describe("Schedule Service Unit Tests", () => {
    let courseId: mongoose.Types.ObjectId;
    let teacherId: mongoose.Types.ObjectId;
    let adminId: mongoose.Types.ObjectId;
    let scheduleId: mongoose.Types.ObjectId;
    let exceptionId: mongoose.Types.ObjectId;
    let timeSlotId: mongoose.Types.ObjectId;
    let course: any;
    let teacher: any;
    let admin: any;
    let schedule: any;
    let exception: any;
    let timeSlot: any;
    let mockSession: any;

    beforeEach(() => {
        // Create mock IDs
        courseId = new mongoose.Types.ObjectId();
        teacherId = new mongoose.Types.ObjectId();
        adminId = new mongoose.Types.ObjectId();
        scheduleId = new mongoose.Types.ObjectId();
        exceptionId = new mongoose.Types.ObjectId();
        timeSlotId = new mongoose.Types.ObjectId();

        // Create mock data
        course = {
            _id: courseId,
            title: "Mathematics 101",
            subjectId: new mongoose.Types.ObjectId(),
            startDate: new Date("2024-01-01"),
            endDate: new Date("2024-06-30"),
            teacherIds: [teacherId],
        };

        teacher = {
            _id: teacherId,
            fullname: "John Doe",
            email: "john.doe@example.com",
            role: Role.TEACHER,
        };

        admin = {
            _id: adminId,
            fullname: "Admin User",
            email: "admin@example.com",
            role: Role.ADMIN,
        };

        timeSlot = {
            _id: timeSlotId,
            slotName: "Slot 1",
            startTime: "08:00",
            endTime: "10:00",
            order: 1,
        };

        schedule = {
            _id: scheduleId,
            courseId,
            teacherId,
            dayOfWeek: DayOfWeek.MONDAY,
            timeSlotId,
            status: ScheduleStatus.PENDING,
            effectiveFrom: new Date("2024-01-01"),
            effectiveTo: new Date("2024-06-30"),
            location: "Room 101",
            requestNote: "Regular class schedule",
            requestedBy: teacherId,
            requestedAt: new Date(),
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockReturnThis(),
        };

        exception = {
            _id: exceptionId,
            scheduleId,
            courseId,
            exceptionDate: new Date("2024-03-15"),
            exceptionType: ExceptionType.RESCHEDULE,
            newTimeSlotId: timeSlotId,
            newLocation: "Room 202",
            reason: "Original room unavailable",
            status: ExceptionStatus.PENDING,
            requestedBy: teacherId,
            requestedAt: new Date(),
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockReturnThis(),
        };

        // Mock session
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };

        // Reset all mocks
        jest.clearAllMocks();

        // appAssert: throw Error(message) when condition falsy
        (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
            if (!condition) throw new Error(message);
        });

        // Mock mongoose session
        (mongoose.startSession as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
    });

    // ====================================
    // TIME SLOT TESTS
    // ====================================
    describe("getAllTimeSlots", () => {
        it("should return all time slots sorted by order", async () => {
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([timeSlot]),
            };
            (TimeSlotModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await getAllTimeSlots();

            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(timeSlot);
            expect(TimeSlotModel.find).toHaveBeenCalledWith({});
            expect(mockQuery.sort).toHaveBeenCalledWith({order: 1});
        });
    });

    // ====================================
    // CREATE SCHEDULE REQUEST TESTS
    // ====================================
    describe("createScheduleRequest", () => {
        let createScheduleInput: CreateScheduleInput;

        beforeEach(() => {
            createScheduleInput = {
                courseId: courseId.toString(),
                teacherId,
                slots: [
                    {dayOfWeek: DayOfWeek.MONDAY, timeSlotId: timeSlotId.toString()},
                    {dayOfWeek: DayOfWeek.WEDNESDAY, timeSlotId: timeSlotId.toString()},
                ],
                effectiveFrom: new Date("2024-01-01"),
                effectiveTo: new Date("2024-06-30"),
                location: "Room 101",
                requestNote: "Regular schedule request",
            };
        });

        it("should create schedule request successfully", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);
            (ScheduleModel.findOne as jest.Mock).mockResolvedValue(null);
            (TimeSlotModel.findById as jest.Mock).mockResolvedValue(timeSlot);

            const createdSchedules = [
                {...schedule, dayOfWeek: DayOfWeek.MONDAY},
                {...schedule, dayOfWeek: DayOfWeek.WEDNESDAY},
            ];

            (ScheduleModel.insertMany as jest.Mock).mockResolvedValue(createdSchedules);

            const mockQuery = {
                populate: jest.fn().mockResolvedValue(createdSchedules),
            };
            (ScheduleModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await createScheduleRequest(createScheduleInput);

            expect(result).toBeDefined();
            expect(result).toHaveLength(2);
            expect(CourseModel.findById).toHaveBeenCalledWith(courseId.toString());
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it("should throw error if course not found", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(createScheduleRequest(createScheduleInput)).rejects.toThrow("Course not found");
            expect(CourseModel.findById).toHaveBeenCalledWith(courseId.toString());
        });

        it("should throw error if teacher not assigned to course", async () => {
            const courseWithoutTeacher = {
                ...course,
                teacherIds: [new mongoose.Types.ObjectId()],
            };
            (CourseModel.findById as jest.Mock).mockResolvedValue(courseWithoutTeacher);

            await expect(createScheduleRequest(createScheduleInput)).rejects.toThrow(
                "Teacher is not assigned to this course"
            );
        });

        it("should throw error if slot has conflict with PENDING status", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);
            (ScheduleModel.findOne as jest.Mock).mockResolvedValue({
                ...schedule,
                status: ScheduleStatus.PENDING,
            });
            (TimeSlotModel.findById as jest.Mock).mockResolvedValue(timeSlot);

            await expect(createScheduleRequest(createScheduleInput)).rejects.toThrow(
                /Teacher already has/
            );
        });

        it("should rollback transaction on error", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue(course);
            (ScheduleModel.findOne as jest.Mock).mockResolvedValue(null);
            (ScheduleModel.insertMany as jest.Mock).mockRejectedValue(new Error("Database error"));

            await expect(createScheduleRequest(createScheduleInput)).rejects.toThrow("Database error");
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });
    });

    // ====================================
    // GET TEACHER WEEKLY SCHEDULE TESTS
    // ====================================
    describe("getTeacherWeeklySchedule", () => {
        it("should return weekly schedule grouped by day", async () => {
            const schedules = [
                {...schedule, dayOfWeek: DayOfWeek.MONDAY},
                {...schedule, dayOfWeek: DayOfWeek.WEDNESDAY},
            ];

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(schedules),
            };
            (ScheduleModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await getTeacherWeeklySchedule(teacherId.toString());

            expect(result).toBeDefined();
            expect(result[DayOfWeek.MONDAY]).toHaveLength(1);
            expect(result[DayOfWeek.WEDNESDAY]).toHaveLength(1);
            expect(result[DayOfWeek.TUESDAY]).toHaveLength(0);
            expect(ScheduleModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    teacherId: teacherId.toString(),
                    status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
                })
            );
        });
    });

    // ====================================
    // GET COURSE SCHEDULE TESTS
    // ====================================
    describe("getCourseSchedule", () => {
        it("should return course schedules sorted by day", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([schedule]),
            };
            (ScheduleModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await getCourseSchedule(courseId.toString());

            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(ScheduleModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
                })
            );
        });
    });

    // ====================================
    // APPROVE SCHEDULE REQUEST TESTS
    // ====================================
    describe("approveScheduleRequest", () => {
        it("should approve schedule request successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(admin);
            (ScheduleModel.findById as jest.Mock).mockResolvedValue(schedule);
            (ScheduleModel.findOne as jest.Mock).mockResolvedValue(null);

            const result = await approveScheduleRequest(scheduleId.toString(), true, adminId);

            expect(result).toBeDefined();
            expect(schedule.status).toBe(ScheduleStatus.APPROVED);
            expect(schedule.approvedBy).toBe(adminId);
            expect(schedule.save).toHaveBeenCalled();
            expect(schedule.populate).toHaveBeenCalled();
        });

        it("should reject schedule request successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(admin);
            (ScheduleModel.findById as jest.Mock).mockResolvedValue(schedule);

            const result = await approveScheduleRequest(
                scheduleId.toString(),
                false,
                adminId,
                "Not suitable timing"
            );

            expect(result).toBeDefined();
            expect(schedule.status).toBe(ScheduleStatus.REJECTED);
            expect(schedule.approvedBy).toBe(adminId);
            expect(schedule.approvalNote).toBe("Not suitable timing");
            expect(schedule.save).toHaveBeenCalled();
        });

        it("should throw error if admin not found", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                approveScheduleRequest(scheduleId.toString(), true, adminId)
            ).rejects.toThrow("Admin user not found");
        });

        it("should throw error if conflict exists when approving", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(admin);
            (ScheduleModel.findById as jest.Mock).mockResolvedValue(schedule);
            (ScheduleModel.findOne as jest.Mock).mockResolvedValue({
                ...schedule,
                status: ScheduleStatus.APPROVED,
            });

            await expect(
                approveScheduleRequest(scheduleId.toString(), true, adminId)
            ).rejects.toThrow("Teacher already has an approved course in this slot");
        });
    });

    // ====================================
    // GET PENDING SCHEDULE REQUESTS TESTS
    // ====================================
    describe("getPendingScheduleRequests", () => {
        it("should return pending schedule requests", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([schedule]),
            };
            (ScheduleModel.find as jest.Mock).mockReturnValue(mockQuery);

            const result = await getPendingScheduleRequests();

            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(ScheduleModel.find).toHaveBeenCalledWith({
                status: ScheduleStatus.PENDING,
            });
            expect(mockQuery.sort).toHaveBeenCalledWith({requestedAt: -1});
        });
    });

    // ====================================
    // CREATE SCHEDULE EXCEPTION TESTS
    // ====================================
    describe("createScheduleException", () => {
        let createExceptionInput: CreateExceptionInput;

        beforeEach(() => {
            createExceptionInput = {
                scheduleId: scheduleId.toString(),
                exceptionDate: new Date("2024-03-15"),
                exceptionType: ExceptionType.RESCHEDULE,
                newTimeSlotId: timeSlotId.toString(),
                newLocation: "Room 202",
                reason: "Original room unavailable",
                requestedBy: teacherId,
            };
        });

        it("should create schedule exception successfully", async () => {
            (ScheduleModel.findById as jest.Mock).mockResolvedValue(schedule);
            (ScheduleExceptionModel.findOne as jest.Mock).mockResolvedValue(null);
            (ScheduleExceptionModel.create as jest.Mock).mockResolvedValue(exception);

            const result = await createScheduleException(createExceptionInput);

            expect(result).toBeDefined();
            expect(ScheduleModel.findById).toHaveBeenCalledWith(scheduleId.toString());
            expect(ScheduleExceptionModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    scheduleId: scheduleId.toString(),
                    exceptionDate: createExceptionInput.exceptionDate,
                    exceptionType: createExceptionInput.exceptionType,
                    status: ExceptionStatus.PENDING,
                })
            );
            expect(exception.populate).toHaveBeenCalled();
        });

        it("should throw error if schedule not found", async () => {
            (ScheduleModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(createScheduleException(createExceptionInput)).rejects.toThrow(
                "Schedule not found"
            );
        });
    });

    // ====================================
    // APPROVE SCHEDULE EXCEPTION TESTS
    // ====================================
    describe("approveScheduleException", () => {
        it("should approve schedule exception successfully", async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(admin);
            (ScheduleExceptionModel.findById as jest.Mock).mockResolvedValue(exception);

            const result = await approveScheduleException(exceptionId.toString(), true, adminId);

            expect(result).toBeDefined();
            expect(exception.status).toBe(ExceptionStatus.APPROVED);
            expect(exception.approvedBy).toBe(adminId);
            expect(exception.save).toHaveBeenCalled();
            expect(exception.populate).toHaveBeenCalled();
        });
    });

    // ====================================
    // GET SCHEDULE WITH EXCEPTIONS TESTS
    // ====================================
    describe("getScheduleWithExceptions", () => {
        it("should return recurring schedule and exceptions", async () => {
            const startDate = "2024-03-01";
            const endDate = "2024-03-31";

            const schedules = [schedule];
            const exceptions = [exception];

            const mockScheduleQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(schedules),
            };
            (ScheduleModel.find as jest.Mock).mockReturnValue(mockScheduleQuery);

            const mockExceptionQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(exceptions),
            };
            (ScheduleExceptionModel.find as jest.Mock).mockReturnValue(mockExceptionQuery);

            const result = await getScheduleWithExceptions(
                courseId.toString(),
                startDate,
                endDate
            );

            expect(result).toBeDefined();
            expect(result.recurringSchedule).toEqual(schedules);
            expect(result.exceptions).toEqual(exceptions);
            expect(ScheduleModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    status: {$in: [ScheduleStatus.APPROVED, ScheduleStatus.ACTIVE]},
                })
            );
            expect(ScheduleExceptionModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    exceptionDate: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                    status: {$in: [ExceptionStatus.APPROVED, ExceptionStatus.ACTIVE]},
                })
            );
        });
    });
});

