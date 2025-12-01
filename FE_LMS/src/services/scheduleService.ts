import http from "../utils/http";
import type {
  TimeSlot,
  Schedule,
  TeacherWeeklySchedule,
  ScheduleException,
  CreateScheduleRequest,
  ApproveScheduleRequest,
  CreateExceptionRequest,
  ApproveExceptionRequest,
  DayOfWeek,
  ScheduleStatus,
} from "../types/schedule";

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry request on transient errors
const retryRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(delayMs * attempt); // Exponential backoff
      }
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      // Check if it's a transient transaction error (code 251 or NoSuchTransaction)
      const isTransientError = 
        error instanceof Error && 
        (error.message.includes('NoSuchTransaction') || 
         error.message.includes('TransientTransactionError') ||
         error.message.includes('transaction'));
      
      if (!isTransientError || attempt === maxRetries - 1) {
        throw error;
      }
      console.log(`Retrying request (attempt ${attempt + 2}/${maxRetries})...`);
    }
  }
  throw lastError;
};

export const scheduleService = {
  // ==========================================
  // TIME SLOTS
  // ==========================================

  /**
   * Get all available time slots
   */
  getTimeSlots: async (): Promise<TimeSlot[]> => {
    const response = await http.get<{ data: TimeSlot[] }>("/schedules/time-slots");
    return response.data || [];
  },

  // ==========================================
  // SCHEDULES
  // ==========================================

  /**
   * Create a new schedule request with multiple slots (Teacher only)
   * Uses slots array format: { courseId, slots: [{dayOfWeek, timeSlotId}, ...], effectiveFrom, ... }
   * Includes retry logic for transient MongoDB transaction errors
   */
  createSchedule: async (data: CreateScheduleRequest): Promise<Schedule[]> => {
    return retryRequest(async () => {
      const response = await http.post<{ data: Schedule[] }>("/schedules", data);
      return Array.isArray(response.data) ? response.data : [response.data];
    }, 3, 500);
  },

  /**
   * Get teacher's weekly schedule
   * @param teacherId - Teacher ID
   * @param date - Optional date for the week (YYYY-MM-DD format)
   * @param status - Optional status filter (can be array)
   */
  getTeacherSchedule: async (
    teacherId: string,
    date?: string,
    status?: ScheduleStatus | ScheduleStatus[]
  ): Promise<TeacherWeeklySchedule> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      statusArray.forEach(s => params.append('status', s));
    }
    
    const queryString = params.toString();
    const url = `/schedules/per-teacher/${teacherId}${queryString ? `?${queryString}` : ''}`;
    const response = await http.get<{ data: TeacherWeeklySchedule }>(url);
    return response.data;
  },

  /**
   * Get course schedule
   * @param courseId - Course ID
   * @param status - Optional status filter (can be array)
   */
  getCourseSchedule: async (
    courseId: string,
    status?: ScheduleStatus | ScheduleStatus[]
  ): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      statusArray.forEach(s => params.append('status', s));
    }
    
    const queryString = params.toString();
    const url = `/schedules/per-course/${courseId}${queryString ? `?${queryString}` : ''}`;
    console.log('[getCourseSchedule] URL:', url); // Debug log
    const response = await http.get<{ data: Schedule[] }>(url);
    return response.data || [];
  },

  /**
   * Approve or reject a schedule request (Admin only)
   * @param scheduleId - Schedule ID
   * @param data - Approval data
   */
  approveSchedule: async (
    scheduleId: string,
    data: ApproveScheduleRequest
  ): Promise<Schedule> => {
    const response = await http.patch<{ data: Schedule }>(
      `/schedules/${scheduleId}/approve`,
      data
    );
    return response.data;
  },

  /**
   * Get all pending schedule requests (Admin only)
   */
  getPendingSchedules: async (): Promise<Schedule[]> => {
    const response = await http.get<{ data: Schedule[] }>("/schedules/pending");
    return response.data || [];
  },

  /**
   * Check if a time slot is available
   * @param dayOfWeek - Day of the week
   * @param timeSlotId - Time slot ID
   * @param teacherId - Teacher ID
   */
  checkAvailability: async (
    dayOfWeek: DayOfWeek,
    timeSlotId: string,
    teacherId: string
  ): Promise<boolean> => {
    const response = await http.get<{ data: { available: boolean } }>(
      "/schedules/check-availability",
      {
        params: { dayOfWeek, timeSlotId, teacherId },
      }
    );
    return response.data?.available ?? true;
  },

  // ==========================================
  // SCHEDULE EXCEPTIONS
  // ==========================================

  /**
   * Create a schedule exception request (Teacher only)
   * @param scheduleId - Original schedule ID
   * @param data - Exception data
   */
  createException: async (
    scheduleId: string,
    data: CreateExceptionRequest
  ): Promise<ScheduleException> => {
    const response = await http.post<{ data: ScheduleException }>(
      `/schedules/exceptions/${scheduleId}`,
      data
    );
    return response.data;
  },

  /**
   * Approve or reject an exception request (Admin only)
   * @param exceptionId - Exception ID
   * @param data - Approval data
   */
  approveException: async (
    exceptionId: string,
    data: ApproveExceptionRequest
  ): Promise<ScheduleException> => {
    const response = await http.patch<{ data: ScheduleException }>(
      `/schedules/exceptions/${exceptionId}/approve`,
      data
    );
    return response.data;
  },

  /**
   * Get exceptions for a course within a date range
   * @param courseId - Course ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  getCourseExceptions: async (
    courseId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ScheduleException[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await http.get<{ data: ScheduleException[] }>(
      `/schedules/exceptions/${courseId}`,
      { params }
    );
    return response.data || [];
  },
};

export default scheduleService;
