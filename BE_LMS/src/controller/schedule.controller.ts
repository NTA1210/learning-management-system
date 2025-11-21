import { catchErrors } from "../utils/asyncHandler";
import { OK, CREATED } from "../constants/http";
import {
  createScheduleSchema,
  approveScheduleSchema,
  createScheduleExceptionSchema,
  approveExceptionSchema,
  checkSlotAvailabilitySchema,
  getScheduleRangeSchema,
  scheduleIdSchema,
  exceptionIdSchema,
  classIdSchema,
  teacherIdSchema,
  timeSlotFilterSchema,
  teacherScheduleQuerySchema,
} from "../validators/schedule.schemas";
import {
  getAllTimeSlots,
  createScheduleRequest,
  getTeacherWeeklySchedule,
  getClassSchedule,
  approveScheduleRequest,
  getPendingScheduleRequests,
  createScheduleException,
  approveScheduleException,
  getScheduleWithExceptions,
  checkSlotAvailability,
} from "../services/schedule.service";

/**
 * Get all available time slots
 * GET /timeslots
 */
export const getTimeSlotsHandler = catchErrors(async (req, res) => {
  // Validate query parameters
  const query = timeSlotFilterSchema.parse(req.query);

  const filter = query.isActive !== undefined ? { isActive: query.isActive === "true" } : {};

  // Call service
  const slots = await getAllTimeSlots(filter);

  return res.success(OK, {
    message: "Time slots retrieved successfully",
    data: slots,
  });
});

/**
 * Create a schedule request
 * POST /schedules
 * Teacher creates request, admin approves
 */
export const createScheduleRequestHandler = catchErrors(async (req, res) => {
  // Validate request body
  const data = createScheduleSchema.parse(req.body);

  const teacherId = req.userId!.toString(); // From authenticate middleware

  // Call service
  const schedule = await createScheduleRequest({
    ...data,
    teacherId,
  });

  return res.success(CREATED, {
    message: "Schedule request created successfully",
    data: schedule,
  });
});

/**
 * Get teacher's weekly schedule
 * GET /teachers/:teacherId/schedule
 */
export const getTeacherScheduleHandler = catchErrors(async (req, res) => {
  // Validate teacher ID param
  const teacherId = teacherIdSchema.parse(req.params.teacherId);
  // Validate query parameters
  const query = teacherScheduleQuerySchema.parse(req.query);

  // Call service
  const schedule = await getTeacherWeeklySchedule(teacherId, query.date);

  return res.success(OK, {
    message: "Teacher schedule retrieved successfully",
    data: schedule,
  });
});

/**
 * Get class schedule
 * GET /classes/:classId/schedule
 */
export const getClassScheduleHandler = catchErrors(async (req, res) => {
  // Validate class ID param
  const classId = classIdSchema.parse(req.params.classId);

  // Call service
  const schedule = await getClassSchedule(classId);

  return res.success(OK, {
    message: "Class schedule retrieved successfully",
    data: schedule,
  });
});

/**
 * Approve or reject schedule request
 * PATCH /schedules/:scheduleId/approve
 * Admin only
 */
export const approveScheduleRequestHandler = catchErrors(async (req, res) => {
  // Validate schedule ID param
  const scheduleId = scheduleIdSchema.parse(req.params.scheduleId);
  // Validate request body
  const data = approveScheduleSchema.parse(req.body);

  const adminId = req.userId!.toString();

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
 * Get pending schedule requests for admin
 * GET /schedules/pending
 * Admin only
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
 * Create a schedule exception
 * POST /schedules/:scheduleId/exceptions
 * Teacher creates exception for their schedule
 */
export const createScheduleExceptionHandler = catchErrors(async (req, res) => {
  // Validate schedule ID param
  const scheduleId = scheduleIdSchema.parse(req.params.scheduleId);
  // Validate request body
  const data = createScheduleExceptionSchema.parse(req.body);

  const teacherId = req.userId!.toString();

  // Call service
  const exception = await createScheduleException({
    scheduleId,
    ...data,
    requestedBy: teacherId,
  });

  return res.success(CREATED, {
    message: "Exception created successfully",
    data: exception,
  });
});

/**
 * Approve or reject schedule exception
 * PATCH /exceptions/:exceptionId/approve
 * Admin only
 */
export const approveScheduleExceptionHandler = catchErrors(async (req, res) => {
  // Validate exception ID param
  const exceptionId = exceptionIdSchema.parse(req.params.exceptionId);
  // Validate request body
  const data = approveExceptionSchema.parse(req.body);

  const adminId = req.userId!.toString();

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
 * Get schedule with exceptions for a date range
 * GET /classes/:classId/schedule/range
 * Returns full schedule including exceptions
 */
export const getScheduleWithExceptionsHandler = catchErrors(async (req, res) => {
  // Validate class ID param
  const classId = classIdSchema.parse(req.params.classId);
  // Validate query parameters
  const query = getScheduleRangeSchema.parse(req.query);

  // Call service
  const schedule = await getScheduleWithExceptions(
    classId,
    query.startDate,
    query.endDate
  );

  return res.success(OK, {
    message: "Schedule with exceptions retrieved successfully",
    data: schedule,
  });
});

/**
 * Check if a time slot is available for a teacher
 * GET /schedules/check-availability
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
    data: { available: isAvailable },
  });
});

