import {catchErrors} from "../utils/asyncHandler";
import {CREATED, OK} from "../constants/http";
import {
    approveExceptionSchema,
    approveScheduleSchema,
    checkSlotAvailabilitySchema,
    courseIdSchema, courseScheduleQuerySchema,
    createScheduleExceptionSchema,
    createScheduleSchema,
    exceptionIdSchema,
    getScheduleRangeSchema,
    scheduleIdSchema,
    teacherIdSchema,
    teacherScheduleQuerySchema,
    timeSlotFilterSchema,
} from "../validators/schedule.schemas";
import {
    approveScheduleException,
    approveScheduleRequest,
    checkSlotAvailability,
    createScheduleException,
    createScheduleRequest,
    getAllTimeSlots,
    getCourseSchedule,
    getPendingScheduleRequests,
    getScheduleWithExceptions,
    getTeacherWeeklySchedule,
} from "../services/schedule.service";

/**
 * Get all available time slots.
 *
 * GET /schedules/time-slots
 */
export const getTimeSlotsHandler = catchErrors(async (req, res) => {
    // Validate query parameters
    const query = timeSlotFilterSchema.parse(req.query);

    const filter = query.isActive !== undefined ? {isActive: query.isActive === "true"} : {};

    // Call service
    const slots = await getAllTimeSlots(filter);

    return res.success(OK, {
        message: "Time slots retrieved successfully",
        data: slots,
    });
});

/**
 * Create a schedule request.
 *
 * POST /schedules
 *
 * Teacher creates request, admin approves.
 * Supports creating multiple schedule slots (day-timeslot combinations) in a single request.
 */
export const createScheduleRequestHandler = catchErrors(async (req, res) => {
    // Validate request body
    const data = createScheduleSchema.parse(req.body);

    const teacherId = req.userId!;

    // Call service - returns array of created schedules
    const schedules = await createScheduleRequest({
        ...data,
        teacherId,
    });

    return res.success(CREATED, {
        message: `Schedule request created successfully with ${schedules.length} slot${schedules.length > 1 ? 's' : ''}`,
        data: schedules,
    });
});

/**
 * Get teacher's weekly schedule.
 *
 * GET /schedules/per-teacher/:teacherId?date=&status=
 */
export const getTeacherScheduleHandler = catchErrors(async (req, res) => {
    // Validate query parameters
    const {date, status} = teacherScheduleQuerySchema.parse(req.query);
    const teacherId = teacherIdSchema.parse(req.params.teacherId);

    // Call service
    const schedule = await getTeacherWeeklySchedule(teacherId, date, status);

    return res.success(OK, {
        message: "Teacher schedule retrieved successfully",
        data: schedule,
    });
});

/**
 * Get course schedule.
 *
 * GET /schedules/per-course/:courseId?status=
 */
export const getCourseScheduleHandler = catchErrors(async (req, res) => {
    // Validate query parameters
    const {status} = courseScheduleQuerySchema.parse(req.query);
    const courseId = courseIdSchema.parse(req.params.courseId);

    // Call service
    const schedule = await getCourseSchedule(courseId, status);

    return res.success(OK, {
        message: "Course schedule retrieved successfully",
        data: schedule,
    });
});

/**
 * Approve or reject schedule request.
 *
 * PATCH /schedules/:scheduleId/approve
 *
 * Admin only.
 */
export const approveScheduleRequestHandler = catchErrors(async (req, res) => {
    // Validate schedule ID param
    const scheduleId = scheduleIdSchema.parse(req.params.scheduleId);
    // Validate request body
    const data = approveScheduleSchema.parse(req.body);

    const adminId = req.userId!;

    // Call service
    const schedule = await approveScheduleRequest(
        scheduleId,
        data.approved,
        adminId,
        data.approvalNote
    );

    return res.success(OK, {
        message: `Schedule ${data.approved ? "approved" : "rejected"} successfully`,
        data: schedule,
    });
});

/**
 * Get pending schedule requests for admin.
 *
 * GET /schedules/pending
 *
 * Admin only.
 */
export const getPendingRequestsHandler = catchErrors(async (req, res) => {
    // Call service
    const requests = await getPendingScheduleRequests();

    return res.success(OK, {
        message: "Pending requests retrieved successfully",
        data: requests,
    });
});

/**
 * Create a schedule exception.
 *
 * POST /schedules/exceptions/:scheduleId
 *
 * Teacher creates exception for their schedule.
 */
export const createScheduleExceptionHandler = catchErrors(async (req, res) => {
    // Validate schedule ID param
    const scheduleId = scheduleIdSchema.parse(req.params.scheduleId);
    // Validate request body
    const data = createScheduleExceptionSchema.parse(req.body);

    const teacherId = req.userId!;

    // Call service
    const exception = await createScheduleException({
        scheduleId,
        ...data,
        replacementTeacherId: data.replacementTeacherId,
        requestedBy: teacherId,
    });

    return res.success(CREATED, {
        message: "Exception created successfully",
        data: exception,
    });
});

/**
 * Approve or reject schedule exception.
 *
 * PATCH /schedules/exceptions/:exceptionId/approve
 *
 * Admin only.
 */
export const approveScheduleExceptionHandler = catchErrors(async (req, res) => {
    // Validate exception ID param
    const exceptionId = exceptionIdSchema.parse(req.params.exceptionId);
    // Validate request body
    const data = approveExceptionSchema.parse(req.body);

    const adminId = req.userId!;

    // Call service
    const exception = await approveScheduleException(
        exceptionId,
        data.approved,
        adminId,
        data.approvalNote
    );

    return res.success(OK, {
        message: `Exception ${data.approved ? "approved" : "rejected"} successfully`,
        data: exception,
    });
});

/**
 * Get schedule with exceptions for a date range.
 *
 * GET /schedules/exceptions/:courseId?startDate=&endDate=
 *
 * Returns full schedule including exceptions.
 */
export const getScheduleWithExceptionsHandler = catchErrors(async (req, res) => {
    // Validate Course ID param
    const courseId = courseIdSchema.parse(req.params.courseId);
    // Validate query parameters
    const query = getScheduleRangeSchema.parse(req.query);

    // Call service
    const schedule = await getScheduleWithExceptions(
        courseId,
        query.startDate,
        query.endDate
    );

    return res.success(OK, {
        message: "Schedule with exceptions retrieved successfully",
        data: schedule,
    });
});

/**
 * Check if a time slot is available for a teacher.
 *
 * GET /schedules/check-availability?dayOfWeek=&timeSlotId=&teacherId=
 */
export const checkSlotAvailabilityHandler = catchErrors(async (req, res) => {
    // Validate query parameters
    const query = checkSlotAvailabilitySchema.parse(req.query);

    // Call service
    const isAvailable = await checkSlotAvailability(
        query.teacherId,
        query.dayOfWeek,
        query.timeSlotId
    );

    return res.success(OK, {
        message: isAvailable ? "Slot is available" : "Slot is already booked",
        data: {available: isAvailable},
    });
});

