import React, { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import './Calendar.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme } from '../hooks/useTheme';

type ViewMode = 'month' | 'week' | 'day';

type PersonalSchedule = {
  id: string;
  type: 'personal';
  title: string;
  color?: string;
  startTime: string | Date;
  endTime?: string | Date;
};

type ClassSchedule = {
  id: string;
  type: 'class';
  subjectCode: string;
  subjectName?: string;
  room?: string;
  specificDate: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
};

type PublicEvent = {
  id: string;
  title: string;
  startDate: string | Date;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function safeFormatDate(dateValue: string | Date | undefined, fmt: string, fallback = ''): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}

const Calendar: React.FC = () => {
  const { darkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [view, setView] = useState<ViewMode>('month');
  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);

  // Mock data (UI only)
  useEffect(() => {
    const base = startOfMonth(currentDate);
    const mockPersonal: PersonalSchedule[] = Array.from({ length: 6 }).map((_, i) => {
      const day = new Date(base);
      day.setDate(3 + i * 4);
      const start = new Date(day);
      start.setHours(9 + (i % 3) * 2, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      return {
        id: `p-${i}`,
        type: 'personal',
        title: `Personal ${i + 1}`,
        color: COLORS[i % COLORS.length],
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    });

    const mockClass: ClassSchedule[] = Array.from({ length: 8 }).map((_, i) => {
      const day = new Date(base);
      day.setDate(2 + i * 3);
      const start = new Date(day);
      start.setHours(13 + (i % 2) * 2, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 2);
      return {
        id: `c-${i}`,
        type: 'class',
        subjectCode: `SUB${(i + 1).toString().padStart(2, '0')}`,
        subjectName: `Subject ${(i + 1)}`,
        room: `R-${100 + i}`,
        specificDate: day.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    });

    const mockEvents: PublicEvent[] = Array.from({ length: 3 }).map((_, i) => {
      const day = new Date(base);
      day.setDate(5 + i * 7);
      day.setHours(10, 0, 0, 0);
      return {
        id: `e-${i}`,
        title: `Event ${(i + 1)}`,
        startDate: day.toISOString(),
      };
    });

    setPersonalSchedules(mockPersonal);
    setClassSchedules(mockClass);
    setEvents(mockEvents);
  }, [currentDate]);

  const getSchedulesForDate = (day: Date) => {
    const personals = personalSchedules.filter((s) => isSameDay(new Date(s.startTime), day));
    const classes = classSchedules.filter((s) => isSameDay(new Date(s.specificDate), day));
    return { personals, classes };
  };

  const getEventsForDate = (day: Date) => {
    return events.filter((e) => isSameDay(new Date(e.startDate), day));
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start);
    const endWeek = endOfWeek(end);
    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  function renderMonthView() {
    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {monthDays.map((day) => {
            const { personals, classes } = getSchedulesForDate(day);
            const dayEvents = getEventsForDate(day);
            const today = isSameDay(day, new Date());
            const inMonth = isSameMonth(day, currentDate);
            type PreviewItem = { key: string; label: string; className: string; color?: string };
            const preview: PreviewItem[] = [
              ...personals.slice(0, 2).map((p) => ({ key: p.id, label: p.title, className: 'personal', color: p.color })),
              ...classes.slice(0, 2).map((c) => ({ key: c.id, label: c.subjectCode, className: 'class', color: undefined })),
              ...dayEvents.slice(0, 1).map((e) => ({ key: e.id, label: e.title, className: 'event', color: undefined })),
            ];
            const totalCount = personals.length + classes.length + dayEvents.length;

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${today ? 'today' : ''} ${inMonth ? '' : 'other-month'}`}
              >
                <div className="day-number">{safeFormatDate(day, 'd')}</div>
                <div className="day-schedules">
                  {preview.map((it) => (
                    <div
                      key={it.key}
                      className={`schedule-item ${it.className}`}
                      style={it.color ? { backgroundColor: it.color } : undefined}
                    >
                      {it.label}
                    </div>
                  ))}
                  {totalCount > 5 && (
                    <div className="more-items">+{totalCount - 5} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWeekView() {
    return (
      <div className="week-view">
        <div className="week-header">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="week-day-header">
              <div className="week-day-name">{safeFormatDate(day, 'EEE').toUpperCase()}</div>
              <div className={`week-day-number ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                {safeFormatDate(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="week-content">
          {weekDays.map((day) => {
            const { personals, classes } = getSchedulesForDate(day);
            const dayEvents = getEventsForDate(day);
            const items = [
              ...personals.map((p) => ({
                id: p.id,
                code: 'PERSONAL',
                time: `${safeFormatDate(p.startTime, 'HH:mm')}${p.endTime ? `-${safeFormatDate(p.endTime, 'HH:mm')}` : ''}`,
                room: '',
              })),
              ...classes.map((c) => ({
                id: c.id,
                code: c.subjectCode,
                time: `${safeFormatDate(c.startTime, 'HH:mm')}${c.endTime ? `-${safeFormatDate(c.endTime, 'HH:mm')}` : ''}`,
                room: c.room ? `At room ${c.room}` : '',
              })),
              ...dayEvents.map((e) => ({ id: e.id, code: 'EVENT', time: safeFormatDate(e.startDate, 'HH:mm'), room: '' })),
            ];
            return (
              <div key={day.toISOString()} className="week-day-column">
                {items.map((it) => (
                  <div key={it.id} className="week-schedule-item-compact">
                    <div className="subject-code">{it.code}</div>
                    <div className="time-range">({it.time})</div>
                    {it.room && <div className="room-info">{it.room}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderDayView() {
    const day = currentDate;
    const personals = personalSchedules.filter((s) => isSameDay(new Date(s.startTime), day));
    const classes = classSchedules.filter((s) => isSameDay(new Date(s.specificDate), day));
    const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate), day));
    const items = [
      ...personals.map((p) => ({
        id: p.id,
        type: 'personal' as const,
        title: p.title,
        time: safeFormatDate(p.startTime, 'HH:mm'),
        location: '',
      })),
      ...classes.map((c) => ({
        id: c.id,
        type: 'class' as const,
        title: `${c.subjectCode}${c.subjectName ? ` - ${c.subjectName}` : ''}`,
        time: safeFormatDate(c.startTime, 'HH:mm'),
        location: c.room || 'No room',
      })),
      ...dayEvents.map((e) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        time: safeFormatDate(e.startDate, 'HH:mm'),
        location: '',
      })),
    ];

    return (
      <div className="day-view">
        <div className="day-header">
          <h2>{safeFormatDate(day, 'EEEE, MMMM d, yyyy')}</h2>
        </div>
        <div className="day-schedule-list">
          {items.length === 0 ? (
            <div className="no-schedules">No schedules for today</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className={`day-schedule-item ${it.type}`}>
                <div className="schedule-time">{it.time}</div>
                <div className="schedule-content">
                  <div className="schedule-title">{it.title}</div>
                  <div className="schedule-location">{it.location}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const today = new Date();
  const { personals: todayPersonals, classes: todayClasses } = getSchedulesForDate(today);
  const todayEvents = getEventsForDate(today);

  return (
    <>
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`calendar-page${darkMode ? ' dark' : ''}`} style={{ paddingTop: 72 }}>
      <div className="calendar-page-header">
        <div className="header-content">
          <h1>Calendar</h1>
          <p>Keep track of classes, personal schedules and events</p>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{personalSchedules.length}</div>
              <div className="stat-label">Personal</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{classSchedules.length}</div>
              <div className="stat-label">Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{events.length}</div>
              <div className="stat-label">Events</div>
            </div>
          </div>
        </div>

        <div className="calendar-page-tabs">
          <button className={`tab-button ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>
            <i className="bi bi-calendar-month"></i> Month
          </button>
          <button className={`tab-button ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
            <i className="bi bi-calendar-week"></i> Week
          </button>
          <button className={`tab-button ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>
            <i className="bi bi-calendar-day"></i> Day
          </button>
        </div>
      </div>

      <div className="calendar-page-content">
        <section className="calendar-section">
          <div className="calendar-container">
            <div className="calendar-controls">
              <div className="calendar-navigation">
                <button onClick={() => setCurrentDate((d) => addMonths(d, -1))}>&lt;</button>
                <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                <button onClick={() => setCurrentDate((d) => addMonths(d, 1))}>&gt;</button>
              </div>
            </div>

            <div className="calendar-content">
              {view === 'month' && renderMonthView()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </div>
          </div>
        </section>

        <aside className="events-section quick-actions-sidebar">
          <div className="sidebar-section">
            <h3>
              <i className="bi bi-lightning-charge"></i>
              Quick Actions
            </h3>
            <button className="quick-action-btn"><i className="bi bi-plus-circle"></i>Add Personal</button>
            <button className="quick-action-btn"><i className="bi bi-megaphone"></i>Add Event</button>
          </div>

          <div className="sidebar-section">
            <h3>
              <i className="bi bi-geo-alt"></i>
              Today
            </h3>
            <div className="today-schedule">
              {todayPersonals.map((p) => (
                <div key={p.id} className="event-item">
                  <div className="event-time">{safeFormatDate(p.startTime, 'HH:mm')}</div>
                  <div className="event-details">
                    <div className="event-title">{p.title}</div>
                    <div className="event-location">Personal</div>
                  </div>
                </div>
              ))}
              {todayClasses.map((c) => (
                <div key={c.id} className="event-item">
                  <div className="event-time">{safeFormatDate(c.startTime, 'HH:mm')}</div>
                  <div className="event-details">
                    <div className="event-title">{c.subjectCode}{c.subjectName ? ` - ${c.subjectName}` : ''}</div>
                    <div className="event-location">{c.room || 'No room'}</div>
                  </div>
                </div>
              ))}
              {todayEvents.map((e) => (
                <div key={e.id} className="event-item">
                  <div className="event-time">{safeFormatDate(e.startDate, 'HH:mm')}</div>
                  <div className="event-details">
                    <div className="event-title">{e.title}</div>
                    <div className="event-location">Public event</div>
                  </div>
                </div>
              ))}
              {todayPersonals.length + todayClasses.length + todayEvents.length === 0 && (
                <div className="no-events">No items today</div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>
              <i className="bi bi-lightbulb"></i>
              Tips
            </h3>
            <div className="tips-list">
              <div className="tip-item"><i className="bi bi-star-fill"></i>Use Week view for planning your sessions.</div>
              <div className="tip-item"><i className="bi bi-star-fill"></i>Click items to see more details (UI only).</div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
};

export default Calendar;


