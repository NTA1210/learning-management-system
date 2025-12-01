import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { Skeleton } from "../components/common/Skeleton.tsx";
import StudentScheduleCalendar from "../components/StudentScheduleCalendar";
import http from "../utils/http";
import { attendanceService } from "../services/attendanceService";
import { quizService } from "../services/quizService";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";

// Types
interface Course {
  _id: string;
  title: string;
  code?: string;
  description?: string;
  logo?: string;
  teacherId?: {
    _id: string;
    fullname?: string;
    username: string;
  };
  progress?: number;
}

interface Assignment {
  _id: string;
  title: string;
  courseId: {
    _id: string;
    title: string;
  };
  dueDate: string;
  status?: string;
  maxScore?: number;
}

interface Quiz {
  _id: string;
  title: string;
  courseId: string | { _id: string; title: string };
  startTime: string;
  endTime: string;
  isPublished?: boolean;
  snapshotQuestions?: any[];
}

interface AttendanceSummary {
  courseId: {
    _id: string;
    title: string;
  };
  totalSessions: number;
  attendanceRate: number;
  counts: {
    present: number;
    absent: number;
    notyet: number;
  };
}

export default function StudentDashboard() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);

  // Data states
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);

  // Stats
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    upcomingQuizzes: 0,
    averageGrade: 0
  });

  // Fetch all data
  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch my courses with specific params as requested
        const myCoursesResponse = await http.get('/courses/my-courses', {
          params: { page: 1, limit: 25, sortOrder: 'desc' }
        });

        const myCoursesData = myCoursesResponse as any;
        const coursesList = Array.isArray(myCoursesData.data)
          ? myCoursesData.data
          : [];

        const totalCourses = myCoursesData.pagination?.total || coursesList.length;

        setEnrolledCourses(coursesList);

        // Update stats using metadata from response
        setStats(prev => ({
          ...prev,
          enrolledCourses: totalCourses
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch assignments
  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        const response = await assignmentService.listAssignments({
          page: 1,
          limit: 10,
          sortBy: 'dueDate',
          sortOrder: 'asc'
        });

        const assignmentsData = response.data || [];
        setAssignments(assignmentsData as unknown as Assignment[]);

        // Count pending assignments (due date in the future)
        const pending = assignmentsData.filter((a) =>
          new Date(a.dueDate) > new Date()
        ).length;

        setStats(prev => ({
          ...prev,
          pendingAssignments: pending
        }));

      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  // Fetch quizzes
  useEffect(() => {
    if (!user || enrolledCourses.length === 0) return;

    const fetchQuizzes = async () => {
      try {
        setQuizzesLoading(true);

        // Fetch quizzes for all enrolled courses
        const quizPromises = enrolledCourses.slice(0, 5).map(course =>
          quizService.getQuizzesByCourseId(course._id, {
            isPublished: true,
            page: 1,
            limit: 5
          }).catch(() => ({ data: [] }))
        );

        const quizResults = await Promise.all(quizPromises);
        const allQuizzes = quizResults.flatMap(result => result.data || []);

        // Filter upcoming quizzes
        const upcoming = allQuizzes.filter((q: Quiz) =>
          new Date(q.startTime) > new Date()
        );

        setQuizzes(upcoming.slice(0, 10));
        setStats(prev => ({
          ...prev,
          upcomingQuizzes: upcoming.length
        }));

      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [user, enrolledCourses]);

  // Fetch attendance data using /self endpoint
  useEffect(() => {
    if (!user) return;

    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);

        const response = await attendanceService.getSelfAttendance({
          page: 1,
          limit: 200
        });

        // Group by course
        const attendanceByCourse: { [key: string]: AttendanceSummary } = {};

        response.data.forEach((record: any) => {
          const courseId = typeof record.courseId === 'object' ? record.courseId._id : record.courseId;
          const courseTitle = typeof record.courseId === 'object' ? record.courseId.title : 'Unknown Course';

          if (!attendanceByCourse[courseId]) {
            attendanceByCourse[courseId] = {
              courseId: { _id: courseId, title: courseTitle },
              totalSessions: 0,
              attendanceRate: 0,
              counts: { present: 0, absent: 0, notyet: 0 }
            };
          }

          attendanceByCourse[courseId].totalSessions++;
          if (record.status === 'present' || record.status === 'absent' || record.status === 'notyet') {
            attendanceByCourse[courseId].counts[record.status]++;
          }
        });

        // Calculate attendance rates
        const attendanceSummary = Object.values(attendanceByCourse).map(summary => ({
          ...summary,
          attendanceRate: summary.totalSessions > 0
            ? (summary.counts.present / summary.totalSessions) * 100
            : 0
        }));

        setAttendanceData(attendanceSummary);

      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);

  // Fetch grades for average calculation
  useEffect(() => {
    if (!user) return;

    const fetchGrades = async () => {
      try {
        setGradesLoading(true);

        const response = await submissionService.getMyGrades();
        const grades = response.data || [];

        // Calculate average grade (only count graded submissions)
        const gradedSubmissions = grades.filter((g) => g.grade !== undefined && g.grade !== null);
        
        if (gradedSubmissions.length > 0) {
          // Calculate weighted average based on maxScore
          let totalWeightedScore = 0;
          let totalMaxScore = 0;

          gradedSubmissions.forEach((submission) => {
            const maxScore = submission.assignmentId?.maxScore || 100;
            totalWeightedScore += (submission.grade || 0);
            totalMaxScore += maxScore;
          });

          const averageGrade = totalMaxScore > 0 
            ? Math.round((totalWeightedScore / totalMaxScore) * 100) 
            : 0;

          setStats(prev => ({
            ...prev,
            averageGrade
          }));
        }

      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setGradesLoading(false);
      }
    };

    fetchGrades();
  }, [user]);

  // Fetch available courses (not enrolled)
  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        setCoursesLoading(true);

        const response = await http.get('/courses', {
          params: { page: 1, limit: 20 }
        });

        const allCourses = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        // Filter out enrolled courses
        const enrolledIds = new Set(enrolledCourses.map(c => c._id));
        const available = allCourses.filter((course: Course) =>
          !enrolledIds.has(course._id)
        );

        setAvailableCourses(available.slice(0, 6));

      } catch (error) {
        console.error('Error fetching available courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    if (enrolledCourses.length > 0) {
      fetchAvailableCourses();
    }
  }, [enrolledCourses]);

  const handleEnroll = async (courseId: string) => {
    // TODO: Implement enrollment logic
    console.log('Enroll in course:', courseId);
  };

  const handleUnenroll = async (courseId: string) => {
    // TODO: Implement unenrollment logic
    console.log('Unenroll from course:', courseId);
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
        color: darkMode ? '#ffffff' : '#1e293b'
      }}
    >
      {/* Navigation */}
      <Navbar />
      {/* Sidebar */}
      <Sidebar role="student" />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16 sm:pl-24 md:pl-28">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1
                className="text-2xl font-bold"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                Student Dashboard
              </h1>
            </div>

            <div className="mb-8">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="7" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                  Welcome back, {user?.fullname || user?.username || 'Student'}!
                </span>
              </h2>
              <p
                style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
              >
                Track your courses, assignments, and academic progress.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl shadow-lg"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : (
                <>
                  {/* Enrolled Courses */}
                  <div
                    className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Enrolled Courses
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                    >
                      {stats.enrolledCourses}
                    </p>
                  </div>

                  {/* Pending Assignments */}
                  <div
                    className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: darkMode ? '#fcd34d' : '#d97706' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Pending Assignments
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                    >
                      {stats.pendingAssignments}
                    </p>
                  </div>

                  {/* Upcoming Quizzes */}
                  <div
                    className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: darkMode ? '#86efac' : '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Upcoming Quizzes
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                    >
                      {stats.upcomingQuizzes}
                    </p>
                  </div>

                  {/* Average Grade */}
                  <div
                    className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: darkMode ? '#c4b5fd' : '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0h2a2 2 0 012-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      Average Grade
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                    >
                      {stats.averageGrade || '-'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* My Schedule Calendar */}
            <div className="mb-8">
              <StudentScheduleCalendar darkMode={darkMode} />
            </div>

            {/* My Courses Grid */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  My Courses
                </h2>
                <a
                  href="/my-courses"
                  className="text-sm font-medium hover:underline"
                  style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                >
                  View All →
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl shadow-lg overflow-hidden"
                      style={{
                        backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                      }}
                    >
                      <Skeleton className="h-32 w-full" />
                      <div className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </div>
                  ))
                ) : enrolledCourses.length === 0 ? (
                  <div className="col-span-3 text-center py-12">
                    <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                      No enrolled courses yet. Explore available courses below!
                    </p>
                  </div>
                ) : (
                  enrolledCourses.slice(0, 6).map((course) => (
                    <div
                      key={course._id}
                      className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{
                        backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      {course.logo ? (
                        <img
                          className="h-32 w-full object-cover"
                          src={course.logo}
                          alt={course.title}
                        />
                      ) : (
                        <div
                          className="h-32 flex items-center justify-center text-4xl font-bold text-white"
                          style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                        >
                          {course.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="p-6">
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                        >
                          {course.title}
                        </h3>
                        {course.code && (
                          <p
                            className="text-sm mb-2"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {course.code}
                          </p>
                        )}
                        {course.teacherId && (
                          <p
                            className="text-sm mb-4"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            Instructor: {typeof course.teacherId === 'object'
                              ? (course.teacherId.fullname || course.teacherId.username)
                              : 'Unknown'}
                          </p>
                        )}
                        <button
                          className="w-full px-3 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: darkMode ? '#4f46e5' : '#6366f1' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4338ca' : '#4f46e5'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4f46e5' : '#6366f1'}
                          onClick={() => window.location.href = `/courses/${course._id}`}
                        >
                          View Course
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Courses for Enrollment */}
            {availableCourses.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                  >
                    Available Courses
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coursesLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl shadow-lg p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ))
                  ) : (
                    availableCourses.map((course) => (
                      <div
                        key={course._id}
                        className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                          border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                        >
                          {course.title}
                        </h3>
                        {course.description && (
                          <p
                            className="text-sm mb-4 line-clamp-2"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {course.description}
                          </p>
                        )}
                        <button
                          onClick={() => handleEnroll(course._id)}
                          className="w-full px-3 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: darkMode ? '#16a34a' : '#22c55e' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#15803d' : '#16a34a'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#16a34a' : '#22c55e'}
                        >
                          Enroll Now
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Recent Assignments & Upcoming Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Assignments */}
              <div
                className="rounded-2xl shadow-lg"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div
                  className="px-6 py-4 border-b"
                  style={{
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                  }}
                >
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                  >
                    Recent Assignments
                  </h2>
                </div>
                <div className="p-6">
                  {assignmentsLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="mb-4 pb-4 border-b last:border-b-0">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))
                  ) : assignments.length === 0 ? (
                    <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                      No assignments found
                    </p>
                  ) : (
                    assignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment._id}
                        className="mb-4 pb-4 border-b last:border-b-0"
                        style={{
                          borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                        }}
                      >
                        <h3
                          className="font-semibold mb-1"
                          style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                        >
                          {assignment.title}
                        </h3>
                        <p
                          className="text-sm mb-2"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          {typeof assignment.courseId === 'object'
                            ? assignment.courseId.title
                            : 'Unknown Course'}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                        >
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                        <button
                          className="mt-2 text-xs font-medium hover:underline"
                          style={{ color: darkMode ? '#a5b4fc' : '#6366f1' }}
                          onClick={() => window.location.href = `/assignments/${assignment._id}`}
                        >
                          View Assignment →
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Quizzes */}
              <div
                className="rounded-2xl shadow-lg"
                style={{
                  backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div
                  className="px-6 py-4 border-b"
                  style={{
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                  }}
                >
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                  >
                    Upcoming Quizzes
                  </h2>
                </div>
                <div className="p-6">
                  {quizzesLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="mb-4 pb-4 border-b last:border-b-0">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))
                  ) : quizzes.length === 0 ? (
                    <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                      No upcoming quizzes
                    </p>
                  ) : (
                    quizzes.slice(0, 5).map((quiz) => {
                      const courseTitle = typeof quiz.courseId === 'object'
                        ? quiz.courseId.title
                        : 'Unknown Course';

                      return (
                        <div
                          key={quiz._id}
                          className="mb-4 pb-4 border-b last:border-b-0"
                          style={{
                            borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)'
                          }}
                        >
                          <h3
                            className="font-semibold mb-1"
                            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                          >
                            {quiz.title}
                          </h3>
                          <p
                            className="text-sm mb-2"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            {courseTitle}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                          >
                            Starts: {new Date(quiz.startTime).toLocaleString()}
                          </p>
                          {quiz.snapshotQuestions && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                            >
                              Questions: {quiz.snapshotQuestions.length}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            {attendanceData.length > 0 && (
              <div className="mb-8">
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                >
                  Attendance Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attendanceLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="p-6 rounded-2xl shadow-lg">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))
                  ) : (
                    attendanceData.map((course) => (
                      <div
                        key={course.courseId._id}
                        className="p-6 rounded-2xl shadow-lg"
                        style={{
                          backgroundColor: darkMode ? 'rgba(26, 32, 44, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                          border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                      >
                        <h3
                          className="font-semibold mb-4"
                          style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
                        >
                          {course.courseId.title}
                        </h3>
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                              Attendance Rate
                            </span>
                            <span
                              className="font-semibold"
                              style={{
                                color: course.attendanceRate >= 75
                                  ? (darkMode ? '#86efac' : '#16a34a')
                                  : course.attendanceRate >= 50
                                    ? (darkMode ? '#fcd34d' : '#d97706')
                                    : (darkMode ? '#fca5a5' : '#dc2626')
                              }}
                            >
                              {course.attendanceRate.toFixed(1)}%
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)' }}
                          >
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${course.attendanceRate}%`,
                                backgroundColor: course.attendanceRate >= 75
                                  ? (darkMode ? '#16a34a' : '#22c55e')
                                  : course.attendanceRate >= 50
                                    ? (darkMode ? '#d97706' : '#f59e0b')
                                    : (darkMode ? '#dc2626' : '#ef4444')
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                          <div>
                            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Present</p>
                            <p className="font-semibold" style={{ color: darkMode ? '#86efac' : '#16a34a' }}>
                              {course.counts.present}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Absent</p>
                            <p className="font-semibold" style={{ color: darkMode ? '#fca5a5' : '#dc2626' }}>
                              {course.counts.absent}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Total</p>
                            <p className="font-semibold" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                              {course.totalSessions}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-4 right-4 z-[100] w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg hover:scale-110 ${darkMode
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}
