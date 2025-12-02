import {Router} from "express";
import {
    getTimeSlotsHandler,
    createScheduleRequestHandler,
    getTeacherScheduleHandler,
    checkSlotAvailabilityHandler,
    getScheduleWithExceptionsHandler,
    getPendingRequestsHandler,
    approveScheduleRequestHandler,
    createScheduleExceptionHandler,
    approveScheduleExceptionHandler, getCourseScheduleHandler,
} from "../controller/schedule.controller";
import {authenticate, authorize} from "../middleware";
import {Role} from "../types";

const scheduleRouter = Router();

// Prefix: /schedules

// Public routes

// Get all available time slots
// GET /schedules/time-slots
scheduleRouter.get("/time-slots", getTimeSlotsHandler);

// Protected routes

// Create schedule request (Teachers only)
// POST /schedules
scheduleRouter.post(
    "/",
    authenticate,
    authorize(Role.TEACHER, Role.ADMIN),
    createScheduleRequestHandler
);

// Get teacher's weekly schedule
// GET /schedules/per-teacher/:teacherId?date=
scheduleRouter.get(
    "/per-teacher/:teacherId",
    authenticate,
    getTeacherScheduleHandler
);

// Get course schedule
// GET /schedules/per-teacher/:courseId
scheduleRouter.get(
    "/per-course/:courseId",
    authenticate,
    getCourseScheduleHandler
);

// Check slot availability
// GET /schedules/check-availability?dayOfWeek=&timeSlotId=&teacherId=
scheduleRouter.get(
    "/check-availability",
    authenticate,
    checkSlotAvailabilityHandler
);

// Get schedule with exceptions for date range
// GET /schedules/exceptions/:courseId?startDate=&endDate=
scheduleRouter.get(
    "/exceptions/:courseId",
    authenticate,
    getScheduleWithExceptionsHandler
);

// Admin routes to approve/reject schedule requests

// Get pending schedule requests (Admin only)
// GET /schedules/pending
scheduleRouter.get(
    "/pending",
    authenticate,
    authorize(Role.ADMIN),
    getPendingRequestsHandler
);

// Approve/reject schedule request (Admin only)
// PATCH /schedules/:scheduleId/approve
scheduleRouter.patch(
    "/:scheduleId/approve",
    authenticate,
    authorize(Role.ADMIN),
    approveScheduleRequestHandler
);

// Exception routes

// Create schedule exception (Teachers for their own schedules)
// POST /schedules/exceptions/:scheduleId
scheduleRouter.post(
    "/exceptions/:scheduleId",
    authenticate,
    authorize(Role.TEACHER),
    createScheduleExceptionHandler
);

// Approve/reject schedule exception (Admin only)
// PATCH /schedules/exceptions/:exceptionId/approve
scheduleRouter.patch(
    "/exceptions/:exceptionId/approve",
    authenticate,
    authorize(Role.ADMIN),
    approveScheduleExceptionHandler
);

export default scheduleRouter;