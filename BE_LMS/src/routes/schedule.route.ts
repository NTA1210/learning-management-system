import { Router } from "express";
import {
  getTimeSlotsHandler,
  createScheduleRequestHandler,
  getTeacherScheduleHandler,
  getClassScheduleHandler,
  checkSlotAvailabilityHandler,
  getScheduleWithExceptionsHandler,
  getPendingRequestsHandler,
  approveScheduleRequestHandler,
  createScheduleExceptionHandler,
  approveScheduleExceptionHandler,
} from "../controller/schedule.controller";
import { authenticate, authorize } from "../middleware";
import { Role } from "../types";

const scheduleRouter = Router();

// Public routes

// Get all available time slots
scheduleRouter.get("/timeslots", getTimeSlotsHandler);

// Protected routes

// Create schedule request (Teachers only)
scheduleRouter.post(
  "/",
  authenticate,
  authorize(Role.TEACHER),
  createScheduleRequestHandler
);

// Get teacher's weekly schedule
scheduleRouter.get(
  "/teachers/:teacherId/schedule",
  authenticate,
  getTeacherScheduleHandler
);

// Get class schedule
scheduleRouter.get(
  "/classes/:classId/schedule",
  authenticate,
  getClassScheduleHandler
);

// Check slot availability
scheduleRouter.get(
  "/check-availability",
  authenticate,
  checkSlotAvailabilityHandler
);

// Get schedule with exceptions for date range
scheduleRouter.get(
  "/classes/:classId/schedule/range",
  authenticate,
  getScheduleWithExceptionsHandler
);

// Admin routes to approve/reject schedule requests

// Get pending schedule requests (Admin only)
scheduleRouter.get(
  "/pending",
  authenticate,
  authorize(Role.ADMIN),
  getPendingRequestsHandler
);

// Approve/reject schedule request (Admin only)
scheduleRouter.patch(
  "/:scheduleId/approve",
  authenticate,
  authorize(Role.ADMIN),
  approveScheduleRequestHandler
);

// Exception routes

// Create schedule exception (Teachers for their own schedules)
scheduleRouter.post(
  "/:scheduleId/exceptions",
  authenticate,
  authorize(Role.TEACHER),
  createScheduleExceptionHandler
);

// Approve/reject schedule exception (Admin only)
scheduleRouter.patch(
  "/exceptions/:exceptionId/approve",
  authenticate,
  authorize(Role.ADMIN),
  approveScheduleExceptionHandler
);

export default scheduleRouter;