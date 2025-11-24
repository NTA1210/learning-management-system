import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import AttendanceStatsOverview from "../components/attendance/AttendanceStatsOverview.tsx";
import AttendanceForm from "../components/attendance/AttendanceForm.tsx";
import AttendanceProgressIndicator from "../components/attendance/AttendanceProgressIndicator.tsx";
import StudentAttendanceModal from "../components/attendance/StudentAttendanceModal.tsx";
import { 
  semesterService, 
  courseService, 
  attendanceService,
  type Semester,
  type CourseAttendanceStats,
} from "../services";
import type { Course } from "../types/course";
import { Users, Download } from "lucide-react";
import { getCurrentDateUTC7 } from "../utils/dateUtils";

export default function AttendancePage() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { semesterId, courseId } = useParams<{ semesterId?: string; courseId?: string }>();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<CourseAttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Find semester closest to current date
  const findClosestSemester = (semesters: Semester[]): Semester | null => {
    if (semesters.length === 0) return null;
    
    const now = new Date();
    // Adjust to UTC+7
    const nowUTC7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    let closest: Semester | null = null;
    let minDiff = Infinity;

    for (const semester of semesters) {
      const startDate = new Date(semester.startDate);
      const endDate = new Date(semester.endDate);
      
      // If current date is within semester range, prioritize it
      if (nowUTC7 >= startDate && nowUTC7 <= endDate) {
        return semester;
      }
      
      // Otherwise, find the closest upcoming semester
      const diff = Math.abs(startDate.getTime() - nowUTC7.getTime());
      if (diff < minDiff && startDate >= nowUTC7) {
        minDiff = diff;
        closest = semester;
      }
    }

    // If no upcoming semester, return the most recent past semester
    if (!closest) {
      return semesters.sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      )[0];
    }

    return closest;
  };

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setLoading(true);
        const data = await semesterService.getAllSemesters();
        setSemesters(data);
        
        if (semesterId) {
          const semester = data.find(s => s._id === semesterId);
          if (semester) {
            setSelectedSemester(semester);
          } else {
            const closest = findClosestSemester(data);
            if (closest) {
              setSelectedSemester(closest);
              navigate(`/attendance/${closest._id}`, { replace: true });
            }
          }
        } else {
          const closest = findClosestSemester(data);
          if (closest) {
            setSelectedSemester(closest);
            navigate(`/attendance/${closest._id}`, { replace: true });
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters();
  }, [semesterId, navigate]);

  // Fetch courses when semester is selected
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedSemester) return;

      try {
        setLoading(true);
        const result = await courseService.getAllCourses({
          semesterId: selectedSemester._id,
          isPublished: true,
          limit: 100,
        });
        setCourses(result.courses || []);
        
        if (courseId) {
          const course = result.courses?.find(c => c._id === courseId);
          if (course) {
            setSelectedCourse(course);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedSemester, courseId]);

  // Fetch attendance stats when course is selected
  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!selectedCourse) {
        setAttendanceStats(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const stats = await attendanceService.getCourseStats(selectedCourse._id);
        setAttendanceStats(stats);
      } catch (err: any) {
        setError(err.message || "Failed to fetch attendance stats");
        setAttendanceStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceStats();
  }, [selectedCourse]);

  const handleSemesterChange = (semester: Semester) => {
    setSelectedSemester(semester);
    setSelectedCourse(null);
    setAttendanceStats(null);
    navigate(`/attendance/${semester._id}`);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    navigate(`/attendance/${selectedSemester?._id}/${course._id}`);
  };

  const handleSaveAttendance = async (entries: Array<{ studentId: string; status: "present" | "absent" }>) => {
    if (!selectedCourse) return;

    try {
      setSaving(true);
      setError(null);
      await attendanceService.createAttendance({
        courseId: selectedCourse._id,
        date: getCurrentDateUTC7(),
        entries,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Refresh stats after saving
      const stats = await attendanceService.getCourseStats(selectedCourse._id);
      setAttendanceStats(stats);
    } catch (err: any) {
      setError(err.message || "Failed to save attendance");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError(null);
      const result = await attendanceService.exportAttendance();
      
      // Create blob and download
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_export_${getCurrentDateUTC7()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to export attendance");
    } finally {
      setExporting(false);
    }
  };

  const handleStudentClick = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
  };

  const handleAttendanceUpdate = async () => {
    if (selectedCourse) {
      const stats = await attendanceService.getCourseStats(selectedCourse._id);
      setAttendanceStats(stats);
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: darkMode ? "#1a202c" : "#f7fafc" }}
    >
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                >
                  Attendance Management
                </h1>
                <p
                  className="text-sm"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Manage student attendance for courses (UTC+7)
                </p>
              </div>
              {user?.role === "admin" && (
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: exporting ? "#94a3b8" : "#6366f1",
                    color: "#ffffff",
                  }}
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-4 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div
                className="mb-4 p-4 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: darkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                }}
              >
                <span>Operation completed successfully!</span>
              </div>
            )}

            {/* Semester Selection */}
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: darkMode ? "#e2e8f0" : "#475569" }}
              >
                Select Semester
              </label>
              <div className="flex flex-wrap gap-2">
                {semesters.map((semester) => (
                  <button
                    key={semester._id}
                    onClick={() => handleSemesterChange(semester)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedSemester?._id === semester._id
                        ? "ring-2 ring-indigo-500"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        selectedSemester?._id === semester._id
                          ? darkMode
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(99, 102, 241, 0.1)"
                          : darkMode
                          ? "rgba(148, 163, 184, 0.1)"
                          : "rgba(148, 163, 184, 0.1)",
                      color: darkMode ? "#e2e8f0" : "#475569",
                    }}
                  >
                    {semester.name}
                  </button>
                ))}
              </div>
              {selectedSemester && (
                <div className="mt-4">
                  <AttendanceProgressIndicator
                    startDate={selectedSemester.startDate}
                    endDate={selectedSemester.endDate}
                    label="Semester Progress"
                  />
                </div>
              )}
            </div>

            {/* Course Selection */}
            {selectedSemester && (
              <div className="mb-6">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: darkMode ? "#e2e8f0" : "#475569" }}
                >
                  Select Course
                </label>
                {loading ? (
                  <div className="text-center py-8">
                    <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Loading courses...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                      No courses available for this semester
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <button
                        key={course._id}
                        onClick={() => handleCourseClick(course)}
                        className={`p-4 rounded-lg text-left transition-all ${
                          selectedCourse?._id === course._id
                            ? "ring-2 ring-indigo-500"
                            : ""
                        }`}
                        style={{
                          backgroundColor:
                            selectedCourse?._id === course._id
                              ? darkMode
                                ? "rgba(99, 102, 241, 0.2)"
                                : "rgba(99, 102, 241, 0.1)"
                              : darkMode
                              ? "rgba(30, 41, 59, 0.5)"
                              : "#ffffff",
                          border: darkMode
                            ? "1px solid rgba(148, 163, 184, 0.1)"
                            : "1px solid rgba(148, 163, 184, 0.2)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {course.logo && (
                            <img
                              src={course.logo}
                              alt={course.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold truncate"
                              style={{ color: darkMode ? "#ffffff" : "#1e293b" }}
                            >
                              {course.title}
                            </h3>
                            {course.subjectId && typeof course.subjectId === "object" && (
                              <p
                                className="text-sm mt-1 truncate"
                                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                              >
                                {course.subjectId.name}
                              </p>
                            )}
                            {course.startDate && course.endDate && (
                              <div className="mt-2">
                                <AttendanceProgressIndicator
                                  startDate={course.startDate}
                                  endDate={course.endDate}
                                  label=""
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attendance Stats and Form */}
            {selectedCourse && attendanceStats && (
              <div className="space-y-6">
                <AttendanceStatsOverview stats={attendanceStats} />
                <AttendanceForm
                  stats={attendanceStats.studentStats}
                  courseId={selectedCourse._id}
                  courseTitle={selectedCourse.title}
                  onSave={handleSaveAttendance}
                  onStudentClick={handleStudentClick}
                  saving={saving}
                />
              </div>
            )}

            {/* Empty State */}
            {selectedCourse && !attendanceStats && !loading && (
              <div
                className="p-8 rounded-lg text-center"
                style={{
                  backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                  border: darkMode
                    ? "1px solid rgba(148, 163, 184, 0.1)"
                    : "1px solid rgba(148, 163, 184, 0.2)",
                }}
              >
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#94a3b8" }} />
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  No attendance data found for this course
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Student Attendance Modal */}
      {selectedStudent && (
        <StudentAttendanceModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          courseId={selectedCourse?._id}
          onUpdate={handleAttendanceUpdate}
        />
      )}
    </div>
  );
}
