import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from "date-fns";
import type { Schedule, DayOfWeek } from "../../types/schedule";

interface ScheduleDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  schedules: Schedule[];
  darkMode: boolean;
  max?: string; // Maximum selectable date (YYYY-MM-DD format)
  disabled?: boolean;
}

// Map day of week string to JS Date day index (0 = Sunday)
const dayOfWeekToIndex: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const ScheduleDatePicker: React.FC<ScheduleDatePickerProps> = ({
  value,
  onChange,
  schedules,
  darkMode,
  max,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    try {
      return value ? parseISO(value) : new Date();
    } catch {
      return new Date();
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse the selected date
  const selectedDate = useMemo(() => {
    try {
      return value ? parseISO(value) : null;
    } catch {
      return null;
    }
  }, [value]);

  // Parse max date
  const maxDate = useMemo(() => {
    try {
      return max ? parseISO(max) : null;
    } catch {
      return null;
    }
  }, [max]);

  // Get all days in the current month view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Calculate which dates have scheduled classes
  const scheduledDates = useMemo(() => {
    const dates = new Set<string>();

    schedules.forEach((schedule) => {
      // Only consider approved/active schedules
      if (schedule.status !== "approved" && schedule.status !== "active") return;

      const dayIndex = dayOfWeekToIndex[schedule.dayOfWeek];
      
      // Get the effective date range from the schedule
      let effectiveFrom: Date;
      let effectiveTo: Date;

      try {
        effectiveFrom = parseISO(schedule.effectiveFrom);
        
        // Use schedule's effectiveTo, or course's endDate, or far future
        if (schedule.effectiveTo) {
          effectiveTo = parseISO(schedule.effectiveTo);
        } else if (typeof schedule.courseId === "object" && schedule.courseId?.endDate) {
          effectiveTo = parseISO(schedule.courseId.endDate);
        } else {
          // Default to 1 year from effectiveFrom if no end date
          effectiveTo = addMonths(effectiveFrom, 12);
        }
      } catch {
        return; // Skip this schedule if dates are invalid
      }

      // Iterate through days in the current month and check if they match
      calendarDays.forEach((day) => {
        if (day.getDay() === dayIndex) {
          // Check if this day falls within the effective period
          if (isWithinInterval(day, { start: effectiveFrom, end: effectiveTo })) {
            dates.add(format(day, "yyyy-MM-dd"));
          }
        }
      });
    });

    return dates;
  }, [schedules, calendarDays]);

  // Get the start day of the week for padding
  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    // Check if date is after max
    if (maxDate && day > maxDate) return;
    
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const isScheduledDay = (day: Date) => {
    return scheduledDates.has(format(day, "yyyy-MM-dd"));
  };

  const isDisabledDay = (day: Date) => {
    if (maxDate && day > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Input Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
        style={{
          backgroundColor: darkMode ? "rgba(30, 41, 59, 0.8)" : "#f8fafc",
          border: darkMode ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(148, 163, 184, 0.3)",
          color: darkMode ? "#e2e8f0" : "#1e293b",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select date"}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 p-3 rounded-lg shadow-xl z-50"
          style={{
            backgroundColor: darkMode ? "#1e293b" : "#ffffff",
            border: darkMode ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid rgba(148, 163, 184, 0.3)",
            minWidth: "280px",
          }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded hover:bg-opacity-20 transition-colors"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.1)",
                color: darkMode ? "#e2e8f0" : "#1e293b",
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span
              className="font-semibold"
              style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded hover:bg-opacity-20 transition-colors"
              style={{
                backgroundColor: darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.1)",
                color: darkMode ? "#e2e8f0" : "#1e293b",
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium py-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for padding */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="w-8 h-8" />
            ))}

            {/* Day cells */}
            {calendarDays.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const hasClass = isScheduledDay(day);
              const isDisabled = isDisabledDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className="w-8 h-8 rounded-full flex flex-col items-center justify-center relative transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? "#6366f1"
                      : isToday
                        ? darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)"
                        : "transparent",
                    color: isSelected
                      ? "#ffffff"
                      : isDisabled
                        ? darkMode ? "#475569" : "#cbd5e1"
                        : !isCurrentMonth
                          ? darkMode ? "#475569" : "#cbd5e1"
                          : darkMode ? "#e2e8f0" : "#1e293b",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    border: isToday && !isSelected ? "1px solid #6366f1" : "none",
                  }}
                >
                  <span className="text-xs">{format(day, "d")}</span>
                  {/* Blue dot indicator for scheduled days */}
                  {hasClass && (
                    <span
                      className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isSelected ? "#ffffff" : "#3b82f6",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs"
            style={{ borderColor: darkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.2)" }}
          >
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#3b82f6" }}
              />
              <span style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Scheduled class</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleDatePicker;
