import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { authService, courseService, enrollmentService, subjectService, specialistService } from "../../services";
import { userService } from "../../services/userService";
import type { Course } from "../../types/course";
import type { CourseFilters } from "../../services/courseService";
import type {
  EnrollmentItem,
  EnrollmentUser,
} from "../../services/enrollmentService";
import Navbar from "../../components/layout/Navbar.tsx";
import Sidebar from "../../components/layout/Sidebar.tsx";
import CreateCourseForm from "../../components/courses/CreateCourseForm.tsx";
import { Search, Trash, Plus, RefreshCw, Archive, CheckCircle, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import http, { httpClient } from "../../utils/http";
import useDebounce from "../../hooks/useDebounce";

const CourseManagement: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [_selectedTeacher] = useState(""); // Reserved for future use
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [, setAvailableCategories] = useState<
    { _id: string; name: string }[]
  >([]);
  const [availableTeachers, setAvailableTeachers] = useState<
    { _id: string; username: string; email: string }[]
  >([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [, setCategorySearchTerm] = useState("");
  const [, setShowCategoryDropdown] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subjectId: "",
    description: "",
    startDate: "",
    endDate: "",
    semesterId: "",
    teacherIds: [] as string[],
    isPublished: false,
    enrollRequiresApproval: true,
    capacity: 50,
    status: "draft",
  });
  const [semesters, setSemesters] = useState<
    Array<{
      _id: string;
      name: string;
      type: string;
      year: number;
      startDate: string;
      endDate: string;
    }>
  >([]);
     
                    
  const [specialists, setSpecialists] = useState<Array<{ _id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ _id: string; name: string; code?: string; specialistIds?: string[] }>>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get("subjectId") ?? "");
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(searchParams.get("specialistId") ?? "");
  const [selectedSemesterId, setSelectedSemesterId] = useState(searchParams.get("semesterId") ?? "");
  const [selectedTeacherId, setSelectedTeacherId] = useState(searchParams.get("teacherId") ?? "");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [enrollPage, setEnrollPage] = useState(1);
  const [enrollLimit, setEnrollLimit] = useState(10);
  const [enrollTotal, setEnrollTotal] = useState(0);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [modalAnim, setModalAnim] = useState<"enter" | "leave" | "none">(
    "none"
  );
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page") ?? "1"));
  const [pageLimit, setPageLimit] = useState(Number(searchParams.get("limit") ?? "25"));
  const [totalCourses, setTotalCourses] = useState(0);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [sortOption, setSortOption] = useState<
    "name_asc" | "name_desc" | "date_asc" | "date_desc"
  >((searchParams.get("sort") as any) || "date_desc");

  // Teacher Search State for Edit Modal
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState<boolean>(false);
  const teacherDropdownRef = useRef<HTMLDivElement | null>(null);
  const [mouseDownOnBackdrop, setMouseDownOnBackdrop] = useState(false);

  const filteredTeachers = React.useMemo(() => {
    if (!teacherSearchQuery.trim()) return availableTeachers;
    const q = teacherSearchQuery.toLowerCase();
    return availableTeachers.filter((t) => {
      const name = (t.username || "").toLowerCase();
      const email = (t.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [availableTeachers, teacherSearchQuery]);

  // Click outside handler for teacher dropdown
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      if (
        teacherDropdownRef.current &&
        !teacherDropdownRef.current.contains(ev.target as Node)
      ) {
        setShowTeacherDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function closeModal() {
    setModalAnim("leave");
  }
  useEffect(() => {
    authService.getCurrentUser();
  }, []);

  useEffect(() => {
    if (modalAnim === "leave") {
      const timeout = setTimeout(() => {
        setShowDetailModal(false);
        setDetailCourse(null);
        setModalAnim("none");
      }, 350); // match CSS duration
      return () => clearTimeout(timeout);
    }
  }, [modalAnim]);

  // Role-based permissions
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  useEffect(() => {
    if (isTeacher && user?._id) {
      setCurrentTeacherId(user._id);
    }

  }, [isTeacher, user]);
  console.log("isTeacher", isTeacher);
  const isStudent = user?.role === "student";
  const canCreate = isAdmin || isTeacher;
  // Check if teacher can edit a specific course
  const canTeacherEditCourse = (course: Course) => {
    if (isAdmin) return true;
    if (isTeacher && currentTeacherId) {
      const ids = Array.isArray(course?.teachers)
        ? course.teachers.map((t) => t._id)
        : Array.isArray((course as any)?.teacherIds)
        ? (course as any).teacherIds
            .map((t: any) => (typeof t === "string" ? t : t?._id))
            .filter(Boolean)
        : [];
      return ids.includes(currentTeacherId);
    }
    return false;
  };

  const canTeacherDeleteCourse = (course: Course) => {
    if (isAdmin) return true;
    if (isTeacher && currentTeacherId) {
      const ids = Array.isArray(course.teachers)
        ? course.teachers.map((t) => t._id)
        : Array.isArray((course as any).teacherIds)
        ? (course as any).teacherIds
            .map((t: any) => (typeof t === "string" ? t : t?._id))
            .filter(Boolean)
        : [];
      return ids.includes(currentTeacherId);
    }
    return false;
  };

  const [enrolling, setEnrolling] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const showToastSuccess = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: message,
        showConfirmButton: false,
        timer: 1000,
      });
    } catch {}
  };

  const showToastInfo = async (message: string) => {
    try {
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: message,
        showConfirmButton: false,
        timer: 1000,
      });
    } catch {}
  };

  const getEnrollmentUser = (
    enrollment: EnrollmentItem
  ): EnrollmentUser | undefined => enrollment.studentId || enrollment.userId;

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrolling((prev) => ({ ...prev, [courseId]: true }));
      await httpClient.post(
        "/enrollments/enroll",
        { courseId, role: "student" },
        { withCredentials: true }
      );
      await showToastSuccess("Enroll thành công");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        const message =
          e?.response?.data?.message ||
          "You are already enrolled in this course.";
        await showToastInfo(message);
      }
      else if (status === 400) {
        await showToastInfo(e?.response?.data?.message || "Enroll failed");
      } else {
        console.error(e);
      }
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get("/semesters");
        const list = Array.isArray((res as any)?.data) ? (res as any).data : [];
        setSemesters(list);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // A Subject is selectable only when it belongs to the selected Specialist.
        // This keeps the filter hierarchy consistent: Specialist -> Subject -> Course.
        const res = await subjectService.getAllSubjects({
          limit: 200,
          // The current Subject API allows sorting by name, not code.
          sortBy: "name",
          sortOrder: "asc",
          isActive: true,
          ...(selectedSpecialistId ? { specialistId: selectedSpecialistId } : {}),
        });
        if (cancelled) return;

        const list = Array.isArray(res?.data) ? res.data : [];
        setSubjects(list as any);
        setSelectedSubjectId((current) =>
          current && list.some((subject: any) => subject._id === current) ? current : ""
        );
      } catch {
        if (!cancelled) setSubjects([]);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedSpecialistId]);

  useEffect(() => {
    (async () => {
      try {
        const { specialists } = await specialistService.getAllSpecialists({ limit: 100 });
        setSpecialists(specialists);
      } catch {}
    })();
  }, []);

  // Fetch teachers list from users API (role = teacher)
  const fetchTeachers = async () => {
    try {
      const { users } = await userService.getUsers({
        role: "teacher",
        limit: 50,
      });
      const normalized = (Array.isArray(users) ? users : []).map((u) => ({
        _id: u._id,
        username: u.username,
        email: (u as any)?.email ?? "",
      }));
      setAvailableTeachers(normalized);
    } catch (e) {
      console.error("Failed to load teachers", e);
      setAvailableTeachers([]);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (!showEditModal) return;
    const subjId = formData.subjectId || ((editingCourse as any)?.subjectId?._id || (editingCourse as any)?.subjectId);
    const selected = subjects.find((s: any) => s._id === subjId);
    const raw = Array.isArray((selected as any)?.specialistIds)
      ? (selected as any).specialistIds
      : Array.isArray((selected as any)?.specialists)
      ? (selected as any).specialists
      : [ (selected as any)?.specialistId || (selected as any)?.specialist ].filter(Boolean);
    const specIds = (Array.isArray(raw) ? raw : [])
      .map((x: any) => (typeof x === 'string' ? x : x?._id))
      .filter((id: any) => typeof id === 'string' && id);
    (async () => {
      try {
        const { users } = await userService.getUsers({ role: 'teacher', specialistIds: specIds});
        const normalized = (Array.isArray(users) ? users : []).map((u) => ({ _id: u._id, username: u.username, email: (u as any)?.email ?? '' }));
        setAvailableTeachers(normalized);
        setSelectedTeachers((prev) => prev.filter((id) => normalized.some((t) => t._id === id)));
      } catch {}
    })();
  }, [showEditModal, formData.subjectId]);

  const changePageLimit = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const isName = sortOption === "name_asc" || sortOption === "name_desc";
      const order = (sortOption.endsWith("asc") ? "asc" : "desc") as
        | "asc"
        | "desc";

      const filters: CourseFilters = {
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(selectedSubjectId && { subjectId: selectedSubjectId }),
        // The selected Subject is already constrained by the Specialist
        // dropdown. Send one of these filters so the existing backend does
        // not broaden a Subject selection back to every course in a Specialist.
        ...(!selectedSubjectId && selectedSpecialistId && { specialistId: selectedSpecialistId }),
        ...(selectedSemesterId && { semesterId: selectedSemesterId }),
        ...(selectedTeacherId && { teacherId: selectedTeacherId }),
        page: currentPage,
        limit: pageLimit,
        isPublished:true,
        ...(isName ? { sortBy: "title" } : {}),
        ...(order ? { sortOrder: order } : {}),
      };
      const result = await courseService.getAllCourses(filters);

      const list = Array.isArray(result.courses) ? result.courses : [];
      setCourses(list);
      setError("");
      if (result.pagination && typeof result.pagination === "object") {
        if ("total" in result.pagination) {
          setTotalCourses((result.pagination as any).total as number);
        } else if ("totalItems" in (result.pagination as any)) {
          setTotalCourses((result.pagination as any).totalItems as number);
        } else if ("count" in (result.pagination as any)) {
          setTotalCourses((result.pagination as any).count as number);
        } else {
          setTotalCourses(list.length);
        }
      } else {
        setTotalCourses(list.length);
      }
      const categories = new Map<string, { _id: string; name: string }>();
      (Array.isArray(result.courses) ? result.courses : []).forEach(
        (course) => {
          const cat = course.category;
          if (cat && cat._id && !categories.has(cat._id)) {
            categories.set(cat._id, { _id: cat._id, name: cat.name });
          }
        }
      );

      setAvailableCategories(Array.from(categories.values()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (
    courseId: string,
    page = enrollPage,
    limit = enrollLimit
  ) => {
    try {
      setEnrollLoading(true);
      const { enrollments: items, pagination } =
        await enrollmentService.getByCourse(courseId, { page, limit });
      setEnrollments(items || []);
      if (pagination) {
        setEnrollTotal(pagination.total || 0);
        setEnrollPage(pagination.page || 1);
        setEnrollLimit(pagination.limit || limit);
      }
    } catch (e) {
      console.error(e);
      setEnrollments([]);
      setEnrollTotal(0);

    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCourses();
  };

  function openDeleteModal(id: string) {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteBusy(true);
    try {
   
        await courseService.deleteCourse(deleteTargetId);
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Delete a successful course", showConfirmButton: false, timer: 1000 });
      await fetchCourses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err instanceof Error ? err.message : "Failed to delete course");
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ toast: true, position: "top-end", icon: "error", title: msg, showConfirmButton: false, timer: 1500 });
    } finally {
      setDeleteBusy(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };
  const localSpec = localStorage.getItem("lms:studentSpecialistIds");
  const localSpecId = (localSpec || "").replace(/[\[\]"]/g, "");

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      subjectId: ((): string => {
        const subj: any = (course as any).subjectId;
        if (typeof subj === "string") return subj;
        if (subj && typeof subj === "object" && subj._id) return subj._id;
        return "";
      })(),
      description: course.description || "",
      startDate: "",
      endDate: "",
      teacherIds: [] as string[],
      isPublished: !!course.isPublished,
      enrollRequiresApproval: true,
      capacity: typeof course.capacity === "number" ? course.capacity : 0,
      status: "draft",
      semesterId: ((): string => {
        const sem: any = (course as any).semesterId;
        if (typeof sem === "string") return sem;
        if (typeof sem === "object" && sem && sem._id) return sem._id;
        return "";
      })(),
    });
    setEditLogoPreview((course as any).logo || "");
    setEditLogoFile(null);
    const normalizedTeacherIds = Array.isArray((course as any).teacherIds)
      ? (course as any).teacherIds
          .map((t: any) => (typeof t === "string" ? t : t?._id))
          .filter(Boolean)
      : Array.isArray(course.teachers)
      ? course.teachers.map((t) => t._id).filter(Boolean)
      : [];
    setSelectedTeachers(normalizedTeacherIds);
    setCategorySearchTerm(course.category?.name || "");
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      await courseService.updateCourse(editingCourse._id, {
        title: formData.title,
        description: formData.description,
        isPublished: formData.isPublished,
        capacity: formData.capacity,
        semesterId: formData.semesterId,
        teacherIds: selectedTeachers,
        logo: editLogoFile || undefined,
      });
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Update a successful course", showConfirmButton: false, timer: 1000 });
      setShowEditModal(false);
      setEditingCourse(null);
      setSelectedTeachers([]);
      setCategorySearchTerm("");
      setShowCategoryDropdown(false);
      await fetchCourses();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err instanceof Error ? err.message : "Failed to update course");
      setError(msg);
      const Swal = (await import("sweetalert2")).default;
      await Swal.fire({ toast: true, position: "top-end", icon: "error", title: msg, showConfirmButton: false, timer: 1500 });
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch courses on param change
  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [currentPage, pageLimit, sortOption, debouncedSearchTerm, selectedSubjectId, selectedSpecialistId, selectedSemesterId, selectedTeacherId, darkMode]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearchTerm) params.search = debouncedSearchTerm;
    if (sortOption) params.sort = sortOption;
    if (selectedSubjectId) params.subjectId = selectedSubjectId;
    if (!selectedSubjectId && selectedSpecialistId) params.specialistId = selectedSpecialistId;
    if (selectedSemesterId) params.semesterId = selectedSemesterId;
    if (selectedTeacherId) params.teacherId = selectedTeacherId;
    params.page = String(currentPage);
    params.limit = String(pageLimit);
    setSearchParams(params);
  }, [debouncedSearchTerm, sortOption, selectedSubjectId, selectedSpecialistId, selectedSemesterId, selectedTeacherId, currentPage, pageLimit, setSearchParams]);
  console.log("totalPage", totalCourses)
  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeInUpModal {
            0% { opacity: 0; transform: translateY(32px) scale(0.96); }
            80% { opacity: 1; }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes fadeOutDownModal {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: translateY(32px) scale(0.96); }
          }
          .modal-fade-enter {
            animation: fadeInUpModal 0.39s cubic-bezier(.22,1,.36,1.02);
          }
          .modal-fade-leave {
            animation: fadeOutDownModal 0.33s cubic-bezier(.36,1,.22,1.02);
          }
        `}
      </style>
      <div
        className="app-page flex h-screen overflow-hidden relative"
        style={{
          backgroundColor: "var(--app-bg)",
          color: darkMode ? "#ffffff" : "#1e293b",
        }}
      >
        {/* Navigation */}
        <Navbar />

        {/* Sidebar */}
        <Sidebar
          role={(user?.role as "admin" | "teacher" | "student") || "student"}
        />

        {/* Main Content */}
        <div
          className="flex flex-col flex-1 w-0 overflow-hidden"
          style={{
            paddingLeft: 0,
            backgroundColor: "transparent",
          }}
        >
          <main className="app-shell-main flex-1 relative overflow-y-auto focus:outline-none">
            <div className="app-content">
              {/* Header */}
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="section-eyebrow mb-1">Courses</p>
                  <h1
                    className="text-3xl font-bold tracking-tight mb-1"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    {isStudent ? "Available Courses" : "Course Management"}
                  </h1>
                  <p className="text-sm" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    {isStudent
                      ? "Browse and enroll in available courses"
                      : "View and manage all courses in the system"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin/courses/deleted")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: darkMode ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                        color: darkMode ? "#fca5a5" : "#b91c1c",
                        border: darkMode ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fecaca"
                      }}
                    >
                      <Trash size={15} />
                      List Deleted
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin/courses/approved")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: darkMode ? "rgba(6, 182, 212, 0.1)" : "#ecfeff",
                        color: darkMode ? "#67e8f9" : "#0891b2",
                        border: darkMode ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid #cffafe"
                      }}
                    >
                      <CheckCircle size={15} />
                      Approve Courses
                    </button>
                  )}
                  {canCreate && (
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        if (isTeacher && currentTeacherId) {
                          setSelectedTeachers([currentTeacherId]);
                        } else {
                          setSelectedTeachers([]);
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center gap-2 cursor-pointer text-white shadow-sm"
                      style={{
                        backgroundColor: "#10b981",
                        boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)"
                      }}
                    >
                      <Plus size={15} />
                      Create Course
                    </button>
                  )}
                  <button
                    onClick={fetchCourses}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: darkMode ? "rgba(79, 70, 229, 0.1)" : "#f5f3ff",
                      color: darkMode ? "#c7d2fe" : "#4f46e5",
                      border: darkMode ? "1px solid rgba(79, 70, 229, 0.2)" : "1px solid #ddd6fe"
                    }}
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filter Control Center */}
              <div
                className="p-5 rounded-2xl mb-8 border flex flex-col gap-5 transition-all duration-300"
                style={{
                  backgroundColor: darkMode ? "rgba(15, 23, 42, 0.45)" : "#ffffff",
                  borderColor: darkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.8)",
                  boxShadow: darkMode
                    ? "0 4px 20px -2px rgba(0, 0, 0, 0.2)"
                    : "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
                }}
              >
                {/* Row 1: Search and Pagination */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                  {/* Search Input with nested icon */}
                  <div className="relative flex-1 max-w-xl">
                    <Search
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    />
                    <input
                      type="text"
                      placeholder="Search courses by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={{
                        backgroundColor: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        color: darkMode ? "#ffffff" : "#1f2937",
                      }}
                    />
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="relative">
                      <select
                        value={pageLimit}
                        onChange={(e) => changePageLimit(Number(e.target.value))}
                        className="appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                        style={{
                          width: 120,
                          background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                          color: darkMode ? "#cbd5e1" : "#475569",
                          borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        }}
                      >
                        {[5, 25, 50, 75, 100].map((l) => (
                          <option key={l} value={l}>
                            {l} / page
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                      </span>
                    </div>

                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: darkMode ? "#94a3b8" : "#64748b",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {`${pageLimit * (currentPage - 1) + 1} – ${Math.min(
                        pageLimit * currentPage,
                        totalCourses
                      )} of ${totalCourses}`}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 rounded-lg border disabled:opacity-40 hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        title="Previous page"
                        style={{
                          background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                          color: darkMode ? "#fff" : "#475569",
                          borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-lg border disabled:opacity-40 hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={pageLimit * currentPage >= totalCourses}
                        title="Next page"
                        style={{
                          background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                          color: darkMode ? "#fff" : "#475569",
                          borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Filters Grid */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t"
                  style={{ borderColor: darkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)" }}
                >
                  {/* My Specialist Toggle / Specialist selector */}
                  {!isAdmin && (
                    <button
                      onClick={() => {
                        if (localSpecId) {
                          if (selectedSpecialistId === localSpecId) {
                            setSelectedSpecialistId("");
                          } else {
                            setSelectedSpecialistId(localSpecId);
                          }
                          setCurrentPage(1);
                        } else {
                          showToastInfo("No specialist found in local storage");
                        }
                      }}
                      className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: selectedSpecialistId && selectedSpecialistId === localSpecId
                          ? "rgba(79, 70, 229, 0.15)"
                          : darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: selectedSpecialistId && selectedSpecialistId === localSpecId
                          ? (darkMode ? "#a5b4fc" : "#4f46e5")
                          : (darkMode ? "#94a3b8" : "#475569"),
                        borderColor: selectedSpecialistId && selectedSpecialistId === localSpecId
                          ? "#4f46e5"
                          : (darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"),
                      }}
                    >
                      <SlidersHorizontal size={14} />
                      {selectedSpecialistId && selectedSpecialistId === localSpecId ? "My Specialist On" : "Filter My Specialist"}
                    </button>
                  )}

                  {/* Specialist Select */}
                  <div className="relative">
                    <select
                      value={selectedSpecialistId}
                      onChange={(e) => {
                        setSelectedSpecialistId(e.target.value);
                        setSelectedSubjectId("");
                        setCurrentPage(1);
                      }}
                      className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: darkMode ? "#cbd5e1" : "#475569",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      }}
                    >
                      <option value="">All Specialists</option>
                      {specialists.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                    </span>
                  </div>

                  {/* Subject Select */}
                  <div className="relative">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => { setSelectedSubjectId(e.target.value); setCurrentPage(1); }}
                      className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: darkMode ? "#cbd5e1" : "#475569",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      }}
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>{s.code ? `${s.code} - ${s.name}` : s.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                    </span>
                  </div>

                  {/* Semester Select */}
                  <div className="relative">
                    <select
                      value={selectedSemesterId}
                      onChange={(e) => { setSelectedSemesterId(e.target.value); setCurrentPage(1); }}
                      className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: darkMode ? "#cbd5e1" : "#475569",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      }}
                    >
                      <option value="">All Semesters</option>
                      {semesters.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                    </span>
                  </div>

                  {/* Teacher Select */}
                  <div className="relative">
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => { setSelectedTeacherId(e.target.value); setCurrentPage(1); }}
                      className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: darkMode ? "#cbd5e1" : "#475569",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      }}
                    >
                      <option value="">All Teachers</option>
                      {availableTeachers.map((t) => (
                        <option key={t._id} value={t._id}>{t.username}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                    </span>
                  </div>

                  {/* Sort Select */}
                  <div className="relative">
                    <select
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(
                          e.target.value as
                            | "name_asc"
                            | "name_desc"
                            | "date_asc"
                            | "date_desc"
                        )
                      }
                      className="w-full appearance-none rounded-xl px-4 py-2 pr-10 border text-xs font-semibold focus:outline-none focus:ring-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: darkMode ? "rgba(30, 41, 59, 0.5)" : "#ffffff",
                        color: darkMode ? "#cbd5e1" : "#475569",
                        borderColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      }}
                    >
                      <option value="name_asc">Sort: A-Z</option>
                      <option value="name_desc">Sort: Z-A</option>
                      <option value="date_asc">Sort: Oldest</option>
                      <option value="date_desc">Sort: Newest</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown size={14} style={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-b-2"
                    style={{ borderColor: darkMode ? "#6366f1" : "#4f46e5" }}
                  ></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div
                  className="p-4 rounded-lg mb-6 flex items-center"
                  style={{
                    backgroundColor: darkMode
                      ? "rgba(239, 68, 68, 0.1)"
                      : "#fee2e2",
                    color: darkMode ? "#fca5a5" : "#dc2626",
                  }}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              )}

              {/* Courses Grid */}
              {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {courses.map((course, index) => (
                    <div
                      key={course._id}
                      className="ui-card ui-card-hover p-5 sm:p-6 transition-all duration-300 flex flex-col h-full"
                      style={{
                        backgroundColor: darkMode
                          ? "rgba(30, 41, 59, 0.75)"
                          : "#ffffff",
                        borderColor: darkMode
                          ? "rgba(255, 255, 255, 0.06)"
                          : "rgba(226, 232, 240, 0.8)",
                        backdropFilter: "blur(8px)",
                        boxShadow: darkMode
                          ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)"
                          : "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
                        animationDelay: `${index * 100}ms`,
                        animation: "fadeInUp 0.6s ease-out forwards",
                      }}
                    >
                      {/* Course Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 items-center mb-3">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                              style={{
                                backgroundColor: course.status === "completed"
                                  ? (darkMode ? "rgba(16, 185, 129, 0.15)" : "#e6fffa")
                                  : (darkMode ? "rgba(99, 102, 241, 0.15)" : "#eef2ff"),
                                color: course.status === "completed"
                                  ? (darkMode ? "#34d399" : "#047857")
                                  : (darkMode ? "#a5b4fc" : "#4f46e5"),
                                border: `1px solid ${course.status === "completed"
                                  ? (darkMode ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.4)")
                                  : (darkMode ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.4)")}`
                              }}
                            >
                              {course.status}
                            </span>
                            {course.isPublished ? (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "#e6fffa",
                                  color: darkMode ? "#34d399" : "#047857",
                                  border: `1px solid ${darkMode ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.4)"}`
                                }}
                              >
                                Published
                              </span>
                            ) : (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(156, 163, 175, 0.15)"
                                    : "#f3f4f6",
                                  color: darkMode ? "#cbd5e1" : "#4b5563",
                                  border: `1px solid ${darkMode ? "rgba(156, 163, 175, 0.25)" : "rgba(156, 163, 175, 0.4)"}`
                                }}
                              >
                                Draft
                              </span>
                            )}
                            {isTeacher && canTeacherEditCourse(course) && (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-sm"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "#fffbeb",
                                  color: darkMode ? "#fbbf24" : "#b45309",
                                  border: `1px solid ${darkMode ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.4)"}`
                                }}
                              >
                                Your Course
                              </span>
                            )}
                          </div>
                          <h3
                            className="text-xl font-bold tracking-tight mb-2 line-clamp-2"
                            style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                          >
                            {course.title}
                          </h3>
                        </div>
                      </div>

                      {/* Course Body (grows to push buttons to the bottom) */}
                      <div className="flex-1 flex flex-col justify-between mb-5">
                        <div className="space-y-4">
                          {/* Course Description */}
                          <p
                            className="text-sm line-clamp-2"
                            style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                          >
                            {course.description}
                          </p>

                          {/* Course Details (Semester & Capacity) */}
                          <div
                            className="space-y-2.5 py-3 border-t border-b"
                            style={{
                              borderColor: darkMode
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(0, 0, 0, 0.05)"
                            }}
                          >
                            <div className="flex items-center text-sm">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(99, 102, 241, 0.1)"
                                    : "#eef2ff"
                                }}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{ color: darkMode ? "#818cf8" : "#4f46e5" }}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                              <span
                                className="font-medium"
                                style={{ color: darkMode ? "#cbd5e1" : "#475569" }}
                              >
                                {(() => {
                                  const sem: any = (course as any).semesterId;
                                  return typeof sem === "object" && sem
                                    ? sem.name || "No Semester"
                                    : "No Semester";
                                })()}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5"
                                style={{
                                  backgroundColor: darkMode
                                    ? "rgba(16, 185, 129, 0.1)"
                                    : "#ecfdf5"
                                }}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{ color: darkMode ? "#34d399" : "#059669" }}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              </div>
                              <span
                                className="font-medium"
                                style={{ color: darkMode ? "#cbd5e1" : "#475569" }}
                              >
                                Capacity: <span className="font-semibold" style={{ color: darkMode ? "#f3f4f6" : "#1f2937" }}>{course.capacity}</span> students
                              </span>
                            </div>
                          </div>

                          {/* Teachers List */}
                          {(() => {
                            const list = Array.isArray((course as any).teacherIds)
                              ? (course as any).teacherIds
                              : Array.isArray(course.teachers)
                              ? course.teachers
                              : [];
                            return list.length > 0 ? (
                              <div>
                                <div
                                  className="text-[10px] uppercase tracking-wider font-bold mb-1.5"
                                  style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                                >
                                  Instructors
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {list.map((teacher: any) => (
                                    <span
                                      key={
                                        typeof teacher === "string"
                                          ? teacher
                                          : teacher?._id
                                      }
                                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                                      style={{
                                        backgroundColor: darkMode
                                          ? "rgba(100, 116, 139, 0.15)"
                                          : "#f1f5f9",
                                        color: darkMode ? "#cbd5e1" : "#475569",
                                        border: darkMode
                                          ? "1px solid rgba(255, 255, 255, 0.04)"
                                          : "1px solid #e2e8f0"
                                      }}
                                    >
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      {typeof teacher === "object" && teacher !== null
                                        ? teacher.fullname || teacher.username || "Teacher"
                                        : "Teacher"}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div
                        className="flex space-x-2 pt-4 border-t mt-auto"
                        style={{
                          borderColor: darkMode
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(226, 232, 240, 0.8)",
                        }}
                      >
                        <button
                          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center"
                          style={{
                            backgroundColor: darkMode
                              ? "rgba(99, 102, 241, 0.15)"
                              : "#eef2ff",
                            color: darkMode ? "#c7d2fe" : "#4f46e5",
                            border: darkMode
                              ? "1px solid rgba(99, 102, 241, 0.25)"
                              : "1px solid #e2e8f0",
                          }}
                          onClick={() => navigate(`/courses/${course._id}`)}
                        >
                          {isStudent ? "View Course" : "View Details"}
                        </button>
                        {canTeacherEditCourse(course) && (
                          <button
                            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center"
                            style={{
                              backgroundColor: darkMode
                                ? "rgba(245, 158, 11, 0.1)"
                                : "#fef3c7",
                              color: darkMode ? "#fde047" : "#d97706",
                              border: darkMode
                                ? "1px solid rgba(245, 158, 11, 0.2)"
                                : "1px solid #fef08a",
                            }}
                            onClick={() => handleEdit(course)}
                          >
                            Edit
                          </button>
                        )}
                        {canTeacherDeleteCourse(course) && (
                          <button
                            className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center"
                            style={{
                              backgroundColor: darkMode
                                ? "rgba(239, 68, 68, 0.15)"
                                : "#fee2e2",
                              color: darkMode ? "#fca5a5" : "#dc2626",
                              border: darkMode
                                ? "1px solid rgba(239, 68, 68, 0.25)"
                                : "1px solid #fecaca",
                            }}
                            onClick={() => openDeleteModal(course._id)}
                          >
                            <Trash size={15} />
                          </button>
                        )}
                        {isStudent && (
                          <button
                            onClick={() => handleEnroll(course._id)}
                            disabled={!!enrolling[course._id]}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 active:scale-95 flex items-center justify-center"
                            style={{
                              backgroundColor: darkMode
                                ? "rgba(16, 185, 129, 0.15)"
                                : "#d1fae5",
                              color: darkMode ? "#6ee7b7" : "#059669",
                              border: darkMode
                                ? "1px solid rgba(16, 185, 129, 0.25)"
                                : "1px solid #a7f3d0",
                            }}
                          >
                            {enrolling[course._id] ? "Enrolling..." : "Enroll"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && courses.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="w-24 h-24 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: darkMode ? "#6b7280" : "#9ca3af" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: darkMode ? "#ffffff" : "#1f2937" }}
                  >
                    {isStudent ? "No courses available" : "No courses found"}
                  </h3>
                  <p style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
                    {isStudent
                      ? "There are no courses available for enrollment at the moment"
                      : "Get started by creating your first course"}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-[9999] p-4 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget && !deleteBusy) { setShowDeleteModal(false); setDeleteTargetId(null); } }}>
            <div className="w-full max-w-md rounded-xl shadow-2xl" style={{ backgroundColor: darkMode ? "#0b132b" : "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b" style={{ borderColor: darkMode ? "rgba(255,255,255,0.06)" : "#eee" }}>
                <h3 className="text-xl font-semibold" style={{ color: darkMode ? "#ffffff" : "#111827" }}>Confirm Delete</h3>
              </div>
              <div className="px-6 py-4 text-sm" style={{ color: darkMode ? "#cbd5e1" : "#4b5563" }}>Are you sure you want to delete this course?</div>
              <div className="px-6 py-4 flex justify-end gap-2">
                <button onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }} disabled={deleteBusy} className="px-4 py-2 rounded-lg" style={{ backgroundColor: darkMode ? "#111827" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>Cancel</button>
                <button onClick={confirmDelete} disabled={deleteBusy || !deleteTargetId} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white disabled:opacity-50">{deleteBusy ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div
            className={`fixed inset-0 z-[9999] p-4 flex items-center justify-center transition-all duration-300 bg-black/40 ${
              modalAnim === "enter"
                ? "modal-fade-enter"
                : modalAnim === "leave"
                ? "modal-fade-leave"
                : ""
            }`}
            onClick={() => {
               // Handled by onMouseUp
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setMouseDownOnBackdrop(true);
              } else {
                setMouseDownOnBackdrop(false);
              }
            }}
            onMouseUp={(e) => {
              if (mouseDownOnBackdrop && e.target === e.currentTarget) {
                setShowCreateModal(false);
                setCategorySearchTerm("");
                setShowCategoryDropdown(false);
              }
              setMouseDownOnBackdrop(false);
            }}
          >
            <div
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              style={{
                backgroundColor: darkMode ? "#0b132b" : "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom: darkMode
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "1px solid #eee",
                }}
              >
                <h3
                  className="text-xl font-semibold"
                  style={{ color: darkMode ? "#ffffff" : "#111827" }}
                >
                  Create New Course
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCategorySearchTerm("");
                    setShowCategoryDropdown(false);
                  }}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{
                    backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
                    color: darkMode ? "#e5e7eb" : "#111827",
                  }}
                >
                  Đóng
                </button>
              </div>
              <CreateCourseForm
                darkMode={darkMode}
                onClose={() => {
                  setShowCreateModal(false);
                  setCategorySearchTerm("");
                  setShowCategoryDropdown(false);
                }}
                onCreated={async () => {
                  const Swal = (await import("sweetalert2")).default;
                  await Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Create a successful course", showConfirmButton: false, timer: 1000 });
                  await fetchCourses();
                }}
                presetTeacherId={
                  isTeacher && currentTeacherId ? currentTeacherId : undefined
                }
              />
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {showEditModal && editingCourse && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4 transition-all duration-300"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(2px)",
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => {
               // Handled by onMouseUp
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setMouseDownOnBackdrop(true);
              } else {
                setMouseDownOnBackdrop(false);
              }
            }}
            onMouseUp={(e) => {
              if (mouseDownOnBackdrop && e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditingCourse(null);
                setCategorySearchTerm("");
                setShowCategoryDropdown(false);
              }
              setMouseDownOnBackdrop(false);
            }}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform shadow-2xl"
              style={{
                backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                animation: "scaleIn 0.3s ease-out",
                border: darkMode
                  ? "1px solid rgba(75, 85, 99, 0.3)"
                  : "1px solid #e5e7eb",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Edit Course</h2>
              <form onSubmit={handleUpdateCourse} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
               
                    <label className="block mb-2 font-semibold">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                      style={{
                        backgroundColor: darkMode
                          ? "rgba(55, 65, 81, 0.8)"
                          : "#ffffff",
                        borderColor: darkMode
                          ? "rgba(75, 85, 99, 0.3)"
                          : "#e5e7eb",
                        color: darkMode ? "#ffffff" : "#000000",
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-2 font-semibold">
                      Select Teachers * ({isTeacher && user?._id ? 1 : selectedTeachers.length} selected)
                      {isTeacher && (
                        <span className="text-sm text-blue-500 ml-2">
                          (You are automatically assigned as the teacher)
                        </span>
                      )}
                    </label>
                    <div
                      ref={teacherDropdownRef}
                      style={{ position: "relative", minWidth: 320 }}
                    >
                      <div
                        onClick={() => !isTeacher && setShowTeacherDropdown(!showTeacherDropdown)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 12px",
                          borderRadius: 12,
                          border: `2px solid ${showTeacherDropdown
                              ? "#10b981"
                              : darkMode
                                ? "rgba(75,85,99,0.3)"
                                : "#e5e7eb"
                            }`,
                          background: darkMode ? "#1f2937" : "white",
                          cursor: isTeacher ? "default" : "pointer",
                          transition: "all 0.2s",
                          boxSizing: "border-box",
                          minHeight: 44,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            overflow: "hidden",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {selectedTeachers.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                overflow: "hidden",
                              }}
                            >
                              {selectedTeachers.slice(0, 3).map((id) => {
                                const t = availableTeachers.find((x) => x._id === id);
                                if (!t) return null;
                                return (
                                  <div
                                    key={id}
                                    title={t.username}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    {(t as any).avatar_url ? (
                                      <img
                                        src={(t as any).avatar_url}
                                        alt={t.username}
                                        style={{
                                          width: 28,
                                          height: 28,
                                          borderRadius: "50%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 28,
                                          height: 28,
                                          borderRadius: "50%",
                                          background: darkMode ? "#374151" : "#f1f5f9",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: darkMode ? "#9ca3af" : "#64748b",
                                          fontSize: 12,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {(t.username || "T")
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {selectedTeachers.length > 3 && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: darkMode ? "#9ca3af" : "#374151",
                                  }}
                                >
                                  +{selectedTeachers.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ color: darkMode ? "#9ca3af" : "#64748b" }}>
                              {isTeacher ? `${user?.username} (You)` : "Select teachers..."}
                            </div>
                          )}
                        </div>
                        {!isTeacher && (
                          <i
                            className={`bi bi-chevron-${showTeacherDropdown ? "up" : "down"}`}
                            style={{
                              color: darkMode ? "#9ca3af" : "#64748b",
                              marginLeft: "auto",
                            }}
                          />
                        )}
                      </div>

                      {showTeacherDropdown && !isTeacher && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: 0,
                            right: 0,
                            background: darkMode ? "#1f2937" : "white",
                            borderRadius: 12,
                            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                            zIndex: 1000,
                            maxHeight: 360,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              padding: 12,
                              borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: darkMode ? "#374151" : "#f1f5f9",
                              }}
                            >
                              <i
                                className="bi bi-search"
                                style={{ color: darkMode ? "#9ca3af" : "#64748b" }}
                              />
                              <input
                                type="text"
                                placeholder="Search teachers..."
                                value={teacherSearchQuery}
                                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  outline: "none",
                                  width: "100%",
                                  color: darkMode ? "#f1f5f9" : "#1e293b",
                                  fontSize: 14,
                                }}
                              />
                              {teacherSearchQuery && (
                                <i
                                  className="bi bi-x-circle-fill"
                                  style={{
                                    color: darkMode ? "#6b7280" : "#9ca3af",
                                    cursor: "pointer",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTeacherSearchQuery("");
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          <div style={{ maxHeight: 280, overflowY: "auto" }}>
                            {filteredTeachers.length === 0 ? (
                              <div
                                style={{
                                  padding: 24,
                                  textAlign: "center",
                                  color: darkMode ? "#9ca3af" : "#64748b",
                                }}
                              >
                                <i
                                  className="bi bi-person-x"
                                  style={{
                                    fontSize: 24,
                                    marginBottom: 8,
                                    display: "block",
                                  }}
                                />
                                No teachers found
                              </div>
                            ) : (
                              filteredTeachers.map((teacher) => {
                                const selected = selectedTeachers.includes(teacher._id);
                                return (
                                  <div
                                    key={teacher._id}
                                    onClick={() => {
                                      setSelectedTeachers((prev) => {
                                        const exists = prev.includes(teacher._id);
                                        return exists ? prev.filter(id => id !== teacher._id) : [...prev, teacher._id];
                                      });
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      padding: "10px 12px",
                                      cursor: "pointer",
                                      background: selected
                                        ? darkMode
                                          ? "rgba(16,185,129,0.12)"
                                          : "rgba(16,185,129,0.08)"
                                        : "transparent",
                                      borderLeft: selected
                                        ? "3px solid #10b981"
                                        : "3px solid transparent",
                                      transition: "all 0.12s",
                                    }}
                                  >
                                    {(teacher as any).avatar_url ? (
                                      <img
                                        src={(teacher as any).avatar_url}
                                        alt={teacher.username}
                                        style={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "50%",
                                          objectFit: "cover",
                                          border: selected
                                            ? "2px solid #10b981"
                                            : `2px solid ${darkMode ? "#374151" : "#e2e8f0"
                                            }`,
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: "50%",
                                          background: selected
                                            ? "linear-gradient(135deg,#10b981,#059669)"
                                            : darkMode
                                              ? "#374151"
                                              : "#e2e8f0",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: selected
                                            ? "white"
                                            : darkMode
                                              ? "#9ca3af"
                                              : "#64748b",
                                          fontWeight: 600,
                                          fontSize: 14,
                                        }}
                                      >
                                        {(teacher.username || "T")
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontWeight: 500,
                                          fontSize: 13,
                                          color: darkMode ? "#f1f5f9" : "#1e293b",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        {teacher.username}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: darkMode ? "#6b7280" : "#94a3b8",
                                          marginTop: 2,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                        }}
                                      >
                                        <i
                                          className="bi bi-envelope"
                                          style={{ fontSize: 10 }}
                                        />
                                        {(teacher as any).email || ""}
                                      </div>
                                    </div>
                                    {selected && (
                                      <i
                                        className="bi bi-check-circle-fill"
                                        style={{ color: "#10b981", fontSize: 16 }}
                                      />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                      style={{
                        backgroundColor: darkMode
                          ? "rgba(55, 65, 81, 0.8)"
                          : "#ffffff",
                        borderColor: darkMode
                          ? "rgba(75, 85, 99, 0.3)"
                          : "#e5e7eb",
                        color: darkMode ? "#ffffff" : "#000000",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">
                      Semester *
                    </label>
                    <select
                      value={formData.semesterId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, semesterId: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                      style={{
                        backgroundColor: darkMode
                          ? "rgba(55, 65, 81, 0.8)"
                          : "#ffffff",
                        borderColor: darkMode
                          ? "rgba(75, 85, 99, 0.3)"
                          : "#e5e7eb",
                        color: darkMode ? "#ffffff" : "#000000",
                      }}
                    >
                      <option value="">Select semester</option>
                      {semesters.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.year})
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
                <div className="flex items-center gap-4 mb-3">
                  <img
                    src={editLogoPreview || (editingCourse as any)?.logo || ('https://api.dicebear.com/9.x/shapes/svg?seed=' + encodeURIComponent(formData.title || editingCourse?.title || 'course'))}
                    alt="Logo"
                    className="h-14 w-14 rounded object-cover border"
                    style={{ borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb' }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setEditLogoFile(file);
                      setEditLogoPreview(file ? URL.createObjectURL(file) : editLogoPreview);
                    }}
                    className="px-3 py-2 rounded-lg border"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-semibold">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode
                        ? "rgba(55, 65, 81, 0.8)"
                        : "#ffffff",
                      borderColor: darkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "#e5e7eb",
                      color: darkMode ? "#ffffff" : "#000000",
                    }}
                  />
                </div>
             
                <div className="flex items-center col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label>Published</label>
                </div>
                <div className="flex space-x-4 col-span-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCourse(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* --- Course Detail Modal --- */}
        {showDetailModal && detailCourse && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4 transition-all duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
            style={{
              backgroundColor: darkMode
                ? "rgba(15,23,42,0.5)"
                : "rgba(0,0,0,0.3)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              className={`relative w-full max-w-5xl rounded-2xl shadow-2xl px-8 py-6 sm:px-10 sm:py-8 border ${
                modalAnim === "enter" ? "modal-fade-enter" : ""
              } ${modalAnim === "leave" ? "modal-fade-leave" : ""}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: darkMode ? "#181F2A" : "#fff",
                color: darkMode ? "#E5E7EB" : "#1e293b",
                border: darkMode ? "1px solid #272B36" : "1px solid #e5e7eb",
                maxHeight: "calc(100vh - 16px)",
                overflowY: "auto",
              }}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-6 text-3xl font-bold focus:outline-none transition-colors"
                aria-label="Close"
                title="Close"
                style={{
                  zIndex: 41,
                  color: darkMode ? "#a3a3a3" : "#666",
                  background: "none",
                  border: "none",
                }}
              >
                ×
              </button>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold mr-2 flex-shrink-0">
                  {detailCourse.title}
                </span>
                <span
                  style={{
                    backgroundColor: darkMode ? "#3730a3" : "#eef2ff",
                    color: darkMode ? "#e0e7ff" : "#4f46e5",
                    borderRadius: "1rem",
                    fontWeight: "bold",
                    padding: "0.25rem 0.75rem",
                    fontSize: "1rem",
                  }}
                >
                  {detailCourse.code}
                </span>
                {detailCourse.isPublished ? (
                  <span
                    style={{
                      backgroundColor: darkMode ? "#065f46" : "#d1fae5",
                      color: darkMode ? "#6ee7b7" : "#059669",
                      fontWeight: "bold",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      padding: "0.18rem 0.75rem",
                    }}
                  >
                    Published
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: darkMode ? "#393a3e" : "#e5e7eb",
                      color: darkMode ? "#a3a3a3" : "#636363",
                      fontWeight: "bold",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      padding: "0.18rem 0.75rem",
                    }}
                  >
                    Draft
                  </span>
                )}
              </div>
              <hr
                style={{
                  borderColor: darkMode ? "#2d3748" : "#e5e7eb",
                  margin: ".9rem 0",
                }}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: course details */}
                <div>
                  <div className="sm:grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                    <div className="mb-2">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#a3a3a3" : "#94a3b8",
                          marginBottom: "0.2rem",
                        }}
                      >
                        Category
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            backgroundColor: darkMode ? "#3730a3" : "#dbeafe",
                            color: darkMode ? "#e0e7ff" : "#4f46e5",
                            borderRadius: ".6rem",
                            fontSize: ".85rem",
                            fontWeight: "bold",
                            padding: "0.15rem 0.7rem",
                          }}
                        >
                          {detailCourse.category?.name || "N/A"}
                        </span>
                      </div>
                      {detailCourse.category?.description && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: darkMode ? "#9ca3af" : "#475569",
                            marginTop: "0.3rem",
                            fontStyle: "italic",
                          }}
                        >
                          {detailCourse.category.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#a3a3a3" : "#94a3b8",
                          marginBottom: "0.2rem",
                        }}
                      >
                        Capacity
                      </div>
                      <div>
                        <span style={{ fontWeight: "bold" }}>
                          {detailCourse.capacity}
                        </span>{" "}
                        student{detailCourse.capacity !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#a3a3a3" : "#94a3b8",
                          marginBottom: "0.2rem",
                        }}
                      >
                        Created At
                      </div>
                      <div>
                        {detailCourse.createdAt
                          ? new Date(detailCourse.createdAt).toLocaleString(
                              undefined,
                              { dateStyle: "medium", timeStyle: "short" }
                            )
                          : ""}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: darkMode ? "#a3a3a3" : "#94a3b8",
                          marginBottom: "0.2rem",
                        }}
                      >
                        Last Updated
                      </div>
                      <div>
                        {detailCourse.updatedAt
                          ? new Date(detailCourse.updatedAt).toLocaleString(
                              undefined,
                              { dateStyle: "medium", timeStyle: "short" }
                            )
                          : ""}
                      </div>
                    </div>
                  </div>
                  <hr
                    style={{
                      borderColor: darkMode ? "#2d3748" : "#e5e7eb",
                      margin: "0.7rem 0",
                    }}
                  />
                  <div style={{ marginBottom: "1.25rem", marginTop: "1.2rem" }}>
                    <div style={{ fontWeight: "bold" }}>Description</div>
                    <div
                      style={{
                        borderRadius: "0.7rem",
                        background: darkMode ? "#232946" : "#f1f5f9",
                        color: darkMode ? "#e5e7eb" : "#374151",
                        padding: "0.6rem 1rem",
                        fontSize: "0.96em",
                        minHeight: 40,
                      }}
                    >
                      {detailCourse.description || (
                        <span
                          style={{
                            fontStyle: "italic",
                            color: darkMode ? "#71717a" : "#64748b",
                          }}
                        >
                          No description.
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: "0.8rem", marginTop: "1.1rem" }}>
                    <div style={{ fontWeight: 600, marginBottom: ".6rem" }}>
                      Teachers
                    </div>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
                    >
                      {(() => {
                        const list = Array.isArray(detailCourse?.teachers)
                          ? detailCourse!.teachers
                          : Array.isArray((detailCourse as any)?.teacherIds)
                          ? (detailCourse as any).teacherIds
                          : [];
                        if (!list.length)
                          return (
                            <span
                              style={{
                                fontStyle: "italic",
                                color: darkMode ? "#a3a3a3" : "#64748b",
                              }}
                            >
                              No teachers assigned
                            </span>
                          );
                        return list.map((t: any) => {
                          const id = typeof t === "string" ? t : t?._id;
                          const username =
                            typeof t === "object" && t !== null
                              ? t.username || "Teacher"
                              : "Teacher";
                          const fullname =
                            typeof t === "object" && t !== null
                              ? t.fullname
                              : "";
                          const email =
                            typeof t === "object" && t !== null ? t.email : "";
                          return (
                            <div
                              key={id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                borderRadius: "1.2rem",
                                backgroundColor: darkMode
                                  ? "#5b21b6"
                                  : "#f3e8ff",
                                color: darkMode ? "#f3e8ff" : "#5b21b6",
                                border: darkMode
                                  ? "1.5px solid #a78bfa"
                                  : "1.5px solid #c4b5fd",
                                minWidth: "100%",
                                padding: "0.55rem 1.1rem",
                                boxShadow: darkMode
                                  ? "0 3px 7px #181F2A"
                                  : "0 1px 5px #ede9fe",
                                fontSize: "0.93em",
                                gap: 12,
                              }}
                            >
                              <img
                                src={
                                  "https://admin.toandz.id.vn/placeholder/img/14.jpg"
                                }
                                alt="avatar"
                                width={48}
                                height={48}
                                style={{
                                  borderRadius: "50%",
                                  aspectRatio: "1 / 1",
                                  objectFit: "cover",
                                  marginRight: 8,
                                  border: darkMode
                                    ? "2px solid #a78bfa"
                                    : "2px solid #c4b5fd",
                                  background: darkMode ? "#232946" : "#fff",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  minWidth: 0,
                                  width: "100%",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {username}
                                </span>
                                {fullname && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: darkMode ? "#f3e8ff" : "#5b21b6",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {fullname}
                                  </span>
                                )}
                                {email && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: darkMode ? "#ddd6fe" : "#7c3aed",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {email}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right: enrolled students */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div style={{ fontWeight: 600 }}>Enrolled Students</div>
                    <div className="flex items-center gap-2">
                      <select
                        value={enrollLimit}
                        onChange={(e) => {
                          const newLimit = Number(e.target.value);
                          setEnrollLimit(newLimit);
                          setEnrollPage(1);
                          fetchEnrollments(detailCourse._id, 1, newLimit);
                        }}
                        className="rounded border px-2 py-1"
                        style={{
                          background: darkMode ? "#1f2937" : "#fff",
                          color: darkMode ? "#e5e7eb" : "#111827",
                          borderColor: darkMode ? "#334155" : "#e5e7eb",
                        }}
                      >
                        {[5, 10, 15, 20].map((l) => (
                          <option key={l} value={l}>
                            {l}/page
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {enrollLoading ? (
                      <div className="p-2">Loading...</div>
                    ) : enrollments.length === 0 ? (
                      <div
                        className="p-2"
                        style={{ color: darkMode ? "#9ca3af" : "#6b7280" }}
                      >
                        No students enrolled.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "1rem",
                        }}
                      >
                        {enrollments.map((item) => {
                          const enrollmentUser = getEnrollmentUser(item);
                          const displayName =
                            enrollmentUser?.username ||
                            enrollmentUser?.email ||
                            "Unknown student";

                          return (
                            <div
                              key={item._id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                borderRadius: "1.2rem",
                                backgroundColor: darkMode ? "#0f766e" : "#ecfeff",
                                color: darkMode ? "#99f6e4" : "#0f766e",
                                border: darkMode
                                  ? "1.5px solid #2dd4bf"
                                  : "1.5px solid #99f6e4",
                                minWidth: "100%",
                                padding: "0.55rem 1.1rem",
                                boxShadow: darkMode
                                  ? "0 3px 7px #181F2A"
                                  : "0 1px 5px #cffafe",
                                fontSize: "0.93em",
                                gap: 12,
                              }}
                            >
                              <img
                                src={
                                  "https://admin.toandz.id.vn/placeholder/img/3.jpg"
                                }
                                alt="avatar"
                                width={48}
                                height={48}
                                style={{
                                  borderRadius: "50%",
                                  aspectRatio: "1 / 1",
                                  objectFit: "cover",
                                  marginRight: 8,
                                  border: darkMode
                                    ? "2px solid #2dd4bf"
                                    : "2px solid #99f6e4",
                                  background: darkMode ? "#232946" : "#fff",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  minWidth: 0,
                                  width: "100%",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {displayName}
                                </span>
                                {enrollmentUser?.fullname && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: darkMode ? "#a7f3d0" : "#0f766e",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {enrollmentUser.fullname}
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: darkMode ? "#99f6e4" : "#0ea5e9",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {enrollmentUser?.email || "No email available"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* pagination */}
                  <div className="flex items-center justify-between mt-3">
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: darkMode ? "#e5e7eb" : "#223344",
                      }}
                    >
                      {enrollTotal === 0
                        ? "0"
                        : `${enrollLimit * (enrollPage - 1) + 1} – ${Math.min(
                            enrollLimit * enrollPage,
                            enrollTotal
                          )} of ${enrollTotal}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 rounded border disabled:opacity-40"
                        onClick={() => {
                          const p = Math.max(1, enrollPage - 1);
                          setEnrollPage(p);
                          fetchEnrollments(detailCourse._id, p, enrollLimit);
                        }}
                        disabled={enrollPage <= 1}
                        style={{
                          background: darkMode ? "#223344" : "#ffffff",
                          color: darkMode ? "#fff" : "#223344",
                          borderColor: darkMode ? "#334155" : "#e5e7eb",
                        }}
                      >
                        &#x2039;
                      </button>
                      <button
                        className="px-3 py-1 rounded border disabled:opacity-40"
                        onClick={() => {
                          const max = Math.ceil(enrollTotal / enrollLimit) || 1;
                          const p = Math.min(max, enrollPage + 1);
                          setEnrollPage(p);
                          fetchEnrollments(detailCourse._id, p, enrollLimit);
                        }}
                        disabled={enrollLimit * enrollPage >= enrollTotal}
                        style={{
                          background: darkMode ? "#223344" : "#ffffff",
                          color: darkMode ? "#fff" : "#223344",
                          borderColor: darkMode ? "#334155" : "#e5e7eb",
                        }}
                      >
                        &#x203A;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CourseManagement;
