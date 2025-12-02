import React, { useEffect, useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  startOfMonth,
  addDays,
  addMonths,
  addWeeks,
  parseISO,
  isWithinInterval,
  isSameMonth,
  isSameDay,
  getDay,
} from "date-fns";
import { scheduleService } from "../../services/scheduleService";
import type { Schedule, TimeSlot, DayOfWeek } from "../../types/schedule";

interface ScheduleTabProps {
  courseId: string;
  darkMode: boolean;
}

type ViewMode = "week" | "month";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ScheduleTab: React.FC<ScheduleTabProps> = ({ courseId, darkMode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // Fetch time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const slots = await scheduleService.getTimeSlots();
        setTimeSlots(slots);
      } catch (err) {
        console.error("Failed to fetch time slots:", err);
      }
    };
    fetchTimeSlots();
  }, []);

  // Fetch course schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!courseId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await scheduleService.getCourseSchedule(courseId, "approved");
        setSchedules(data);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [courseId]);

  // Get time slot by ID
  const getTimeSlot = (timeSlotId: string): TimeSlot | undefined => {
    if (typeof timeSlotId === "object" && timeSlotId !== null) {
      return timeSlotId as unknown as TimeSlot;
    }
    return timeSlots.find((slot) => slot._id === timeSlotId);
  };

  // Check if a schedule is active on a specific date
  const isScheduleActiveOnDate = (schedule: Schedule, date: Date): boolean => {
    const effectiveFrom = parseISO(schedule.effectiveFrom);
    const effectiveTo = schedule.effectiveTo
      ? parseISO(schedule.effectiveTo)
      : new Date("2099-12-31");

    // Check if date is within the effective range
    if (!isWithinInterval(date, { start: effectiveFrom, end: effectiveTo })) {
      return false;
    }

    // Check if the day of week matches
    const dayOfWeek = getDay(date);
    // Convert Sunday=0 to our format (Monday=0)
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const scheduleDayIndex = DAYS_OF_WEEK.indexOf(schedule.dayOfWeek.toLowerCase() as DayOfWeek);

    return adjustedDay === scheduleDayIndex;
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date): Schedule[] => {
    return schedules
      .filter((schedule) => isScheduleActiveOnDate(schedule, date))
      .sort((a, b) => {
        const slotA = getTimeSlot(a.timeSlotId);
        const slotB = getTimeSlot(b.timeSlotId);
        if (!slotA || !slotB) return 0;
        return slotA.startTime.localeCompare(slotB.startTime);
      });
  };

  // Filter active schedules for the current week
  const activeSchedules = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    return schedules.filter((schedule) => {
      const effectiveFrom = parseISO(schedule.effectiveFrom);
      const effectiveTo = schedule.effectiveTo
        ? parseISO(schedule.effectiveTo)
        : new Date("2099-12-31");

      return (
        isWithinInterval(weekStart, { start: effectiveFrom, end: effectiveTo }) ||
        isWithinInterval(weekEnd, { start: effectiveFrom, end: effectiveTo }) ||
        (effectiveFrom <= weekStart && effectiveTo >= weekEnd)
      );
    });
  }, [schedules, currentDate]);

  // Group schedules by day for week view
  const schedulesByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, Schedule[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    activeSchedules.forEach((schedule) => {
      const day = schedule.dayOfWeek.toLowerCase() as DayOfWeek;
      if (grouped[day]) {
        grouped[day].push(schedule);
      }
    });

    Object.keys(grouped).forEach((day) => {
      grouped[day as DayOfWeek].sort((a, b) => {
        const slotA = getTimeSlot(a.timeSlotId);
        const slotB = getTimeSlot(b.timeSlotId);
        if (!slotA || !slotB) return 0;
        return slotA.startTime.localeCompare(slotB.startTime);
      });
    });

    return grouped;
  }, [activeSchedules, timeSlots]);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    const days: Date[] = [];
    let day = startDate;
    
    // Generate 6 weeks of days (42 days)
    for (let i = 0; i < 42; i++) {
      days.push(day);
      day = addDays(day, 1);
      // Stop if we've passed the month end and completed the week
      if (i > 27 && !isSameMonth(day, currentDate) && getDay(day) === 1) {
        break;
      }
    }
    
    return days;
  }, [currentDate]);

  // Sort time slots by order - MUST be before any early returns
  const sortedTimeSlots = useMemo(() => {
    return [...timeSlots].sort((a, b) => a.order - b.order);
  }, [timeSlots]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePrev = () => {
    if (viewMode === "week") {
      setCurrentDate((prev) => addWeeks(prev, -1));
    } else {
      setCurrentDate((prev) => addMonths(prev, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get schedule for a specific day and time slot
  const getScheduleForSlot = (day: DayOfWeek, slotId: string): Schedule | undefined => {
    return activeSchedules.find(
      (schedule) =>
        schedule.dayOfWeek.toLowerCase() === day &&
        (typeof schedule.timeSlotId === "string"
          ? schedule.timeSlotId === slotId
          : (schedule.timeSlotId as unknown as TimeSlot)?._id === slotId)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3" style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          Loading schedule...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center py-12"
        style={{ color: darkMode ? "#f87171" : "#dc2626" }}
      >
        {error}
      </div>
    );
  }

  const renderWeekView = () => (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse"
        style={{
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr>
            {/* Slot column header */}
            <th
              className="p-3 text-center font-semibold"
              style={{
                background: darkMode ? "#1e293b" : "#f1f5f9",
                color: darkMode ? "#e5e7eb" : "#374151",
                borderBottom: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                borderRight: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                minWidth: "100px",
              }}
            >
              Slot
            </th>
            {/* Day columns */}
            {DAYS_OF_WEEK.map((day, index) => {
              const dayDate = addDays(weekStart, index);
              const isToday = isSameDay(new Date(), dayDate);
              return (
                <th
                  key={day}
                  className="p-3 text-center font-semibold"
                  style={{
                    background: isToday
                      ? "#3b82f6"
                      : darkMode
                      ? "#1e293b"
                      : "#f1f5f9",
                    color: isToday ? "white" : darkMode ? "#e5e7eb" : "#374151",
                    borderBottom: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                    borderRight: index < 6 ? `1px solid ${darkMode ? "#374151" : "#e2e8f0"}` : "none",
                    minWidth: "120px",
                  }}
                >
                  <div className="capitalize">{DAY_LABELS[index]}</div>
                  <div className="text-sm font-normal opacity-75">
                    {format(dayDate, "MMM d")}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedTimeSlots.map((slot, slotIndex) => (
            <tr key={slot._id}>
              {/* Time slot label - only show slot number */}
              <td
                className="p-2 text-center"
                style={{
                  background: darkMode ? "#1e293b" : "#f8fafc",
                  borderBottom: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                  borderRight: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                }}
              >
                <div
                  className="font-medium text-sm"
                  style={{ color: darkMode ? "#e5e7eb" : "#374151" }}
                >
                  Slot {slotIndex + 1}
                </div>
              </td>
              {/* Day cells for this time slot */}
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const schedule = getScheduleForSlot(day, slot._id);
                const dayDate = addDays(weekStart, dayIndex);
                const isToday = isSameDay(new Date(), dayDate);

                return (
                  <td
                    key={`${day}-${slot._id}`}
                    className="p-2 text-center align-middle"
                    style={{
                      background: isToday
                        ? "rgba(59, 130, 246, 0.05)"
                        : darkMode
                        ? "#0f172a"
                        : "#ffffff",
                      borderBottom: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                      borderRight: dayIndex < 6 ? `1px solid ${darkMode ? "#374151" : "#e2e8f0"}` : "none",
                      height: "70px",
                    }}
                  >
                    {schedule ? (
                      <div
                        className="p-2 rounded-lg text-sm mx-auto"
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          maxWidth: "160px",
                        }}
                      >
                        
                        <div className="text-xs mt-1 opacity-90 flex items-center justify-center gap-1">
                          <i className="bi bi-geo-alt"></i>
                          {schedule.location || "TBD"}
                        </div>
                        <div
                          className="text-xs mt-1 font-medium"
                          style={{
                            color: "#fbbf24",
                          }}
                        >
                          ({slot.startTime}-{slot.endTime})
                        </div>
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: darkMode ? "#4b5563" : "#d1d5db" }}
                      >
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMonthView = () => (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse"
        style={{
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr>
            {DAY_LABELS.map((day) => (
              <th
                key={day}
                className="p-2 text-center font-semibold text-sm"
                style={{
                  background: darkMode ? "#1e293b" : "#f1f5f9",
                  color: darkMode ? "#e5e7eb" : "#374151",
                  borderBottom: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map(
            (_, weekIndex) => (
              <tr key={weekIndex}>
                {calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(new Date(), day);
                  const daySchedules = getSchedulesForDate(day);

                  return (
                    <td
                      key={day.toISOString()}
                      className="p-1 align-top"
                      style={{
                        background: isToday
                          ? "rgba(59, 130, 246, 0.1)"
                          : darkMode
                          ? "#0f172a"
                          : "#ffffff",
                        border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                        opacity: isCurrentMonth ? 1 : 0.4,
                        minHeight: "80px",
                        height: "100px",
                        width: "14.28%",
                      }}
                    >
                      <div className="h-full">
                        <div
                          className="text-sm font-medium mb-1 text-center"
                          style={{
                            color: isToday
                              ? "#3b82f6"
                              : darkMode
                              ? "#e5e7eb"
                              : "#374151",
                          }}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {daySchedules.slice(0, 2).map((schedule) => {
                            const timeSlot = getTimeSlot(schedule.timeSlotId);
                            return (
                              <div
                                key={schedule._id}
                                className="px-1 py-0.5 rounded text-xs truncate"
                                style={{
                                  background: "#3b82f6",
                                  color: "white",
                                }}
                                title={`${
                                  timeSlot
                                    ? `${timeSlot.startTime} - ${timeSlot.endTime}`
                                    : "Time TBD"
                                }${schedule.location ? ` @ ${schedule.location}` : ""}`}
                              >
                                {timeSlot ? timeSlot.startTime : "TBD"}
                              </div>
                            );
                          })}
                          {daySchedules.length > 2 && (
                            <div
                              className="text-xs text-center"
                              style={{
                                color: darkMode ? "#9ca3af" : "#6b7280",
                              }}
                            >
                              +{daySchedules.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="schedule-tab">
      {/* Navigation */}
      <div
        className="flex items-center justify-between mb-6"
        style={{ flexWrap: "wrap", gap: "12px" }}
      >
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{
              border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
            }}
          >
            <button
              onClick={() => setViewMode("week")}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background:
                  viewMode === "week"
                    ? "#3b82f6"
                    : darkMode
                    ? "#1e293b"
                    : "#f8fafc",
                color: viewMode === "week" ? "white" : darkMode ? "#e5e7eb" : "#374151",
              }}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background:
                  viewMode === "month"
                    ? "#3b82f6"
                    : darkMode
                    ? "#1e293b"
                    : "#f8fafc",
                color: viewMode === "month" ? "white" : darkMode ? "#e5e7eb" : "#374151",
              }}
            >
              Month
            </button>
          </div>

          <button
            onClick={handlePrev}
            className="px-3 py-2 rounded-lg transition-colors"
            style={{
              background: darkMode ? "#374151" : "#f1f5f9",
              color: darkMode ? "#e5e7eb" : "#374151",
            }}
          >
            ← Prev
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              background: "#3b82f6",
              color: "white",
            }}
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-2 rounded-lg transition-colors"
            style={{
              background: darkMode ? "#374151" : "#f1f5f9",
              color: darkMode ? "#e5e7eb" : "#374151",
            }}
          >
            Next →
          </button>
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
        >
          {viewMode === "week"
            ? `Week of ${format(weekStart, "MMM d, yyyy")}`
            : format(currentDate, "MMMM yyyy")}
        </h3>
      </div>

      {/* Schedule Content */}
      {schedules.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{
            background: darkMode ? "#1e293b" : "#f8fafc",
            color: darkMode ? "#9ca3af" : "#6b7280",
          }}
        >
          <i className="bi bi-calendar-x text-4xl mb-3 block opacity-50"></i>
          <p>No schedule found for this course.</p>
        </div>
      ) : (
        <>
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </>
      )}
    </div>
  );
};

export default ScheduleTab;
