import React, { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { courseService } from "../services";
import type { Course } from "../types/course";
import type { CourseFilters } from "../services/courseService";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";

const CourseManagement: React.FC = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [_selectedTeacher] = useState(""); // Reserved for future use
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [availableCategories, setAvailableCategories] = useState<{ _id: string; name: string }[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<{ _id: string; username: string; email: string }[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    category: "",
    isPublished: false,
    capacity: 0,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  // Animation state for modal
  const [modalAnim, setModalAnim] = useState<'enter'|'leave'|'none'>('none');
  const [contentPaddingLeft, setContentPaddingLeft] = useState(window.innerWidth >= 640 ? 93 : 0);

  function openDetail(course: Course) {
    setDetailCourse(course);
    setShowDetailModal(true);
    setModalAnim('enter');
  }
  function closeModal() {
    setModalAnim('leave');
  }

  useEffect(() => {
    if (modalAnim === 'leave') {
      const timeout = setTimeout(() => {
        setShowDetailModal(false);
        setDetailCourse(null);
        setModalAnim('none');
      }, 350); // match CSS duration
      return () => clearTimeout(timeout);
    }
  }, [modalAnim]);

  // Role-based permissions
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const canCreate = isAdmin || isTeacher;
  // Check if teacher can edit a specific course
  const canTeacherEditCourse = (course: Course) => {
    if (isAdmin) return true;
    if (isTeacher && currentTeacherId) {
      // Teacher can only edit courses they are assigned to
      return course.teachers.some(teacher => teacher._id === currentTeacherId);
    }
    return false;
  };

  // Check if teacher can delete a specific course
  const canTeacherDeleteCourse = (course: Course) => {
    if (isAdmin) return true;
    if (isTeacher && currentTeacherId) {
      // Teacher can delete courses they are assigned to
      return course.teachers.some(teacher => teacher._id === currentTeacherId);
    }
    return false;
  };

  useEffect(() => {
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch teacher ID when component loads
  useEffect(() => {
    if (isTeacher) {
      getTeacherIdFromAPI().then(teacherId => {
        setCurrentTeacherId(teacherId);
      });
    }
  }, [isTeacher]);

  // Helper function to get teacher ID from API
  const getTeacherIdFromAPI = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_API}/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData._id;
      }
    } catch (error) {
      console.error('Error fetching user from API:', error);
    }
    return null;
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const filters: CourseFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (_selectedTeacher) filters.teacherId = _selectedTeacher;
      
      const result = await courseService.getAllCourses(filters);
      setCourses(result.courses);
      setError("");

      // Extract unique categories and teachers from courses
      const categories = new Map<string, { _id: string; name: string }>();
      const teachers = new Map<string, { _id: string; username: string; email: string }>();
      
      result.courses.forEach(course => {
        if (course.category && !categories.has(course.category._id)) {
          categories.set(course.category._id, { _id: course.category._id, name: course.category.name });
        }
        course.teachers.forEach(teacher => {
          if (!teachers.has(teacher._id)) {
            teachers.set(teacher._id, { _id: teacher._id, username: teacher.username, email: teacher.email });
          }
        });
      });
      
      setAvailableCategories(Array.from(categories.values()));
      setAvailableTeachers(Array.from(teachers.values()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCourses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    
    try {
      await courseService.deleteCourse(id);
      await fetchCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      code: course.code || "",
      description: course.description || "",
      category: course.category?._id || "",
      isPublished: course.isPublished,
      capacity: course.capacity || 0,
    });
    setSelectedTeachers(course.teachers.map(t => t._id));
    setCategorySearchTerm(course.category?.name || "");
    setShowEditModal(true);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For teachers, they are automatically assigned, so we don't need to check selectedTeachers.length
    const hasTeachers = isTeacher ? true : selectedTeachers.length > 0;
    
    if (!formData.category || !hasTeachers) {
      const errorMessage = !formData.category 
        ? "Please select a category" 
        : "Please select at least one teacher";
      alert(errorMessage);
      return;
    }

    try {
      // If teacher is creating course, add their ID from state
      let teachersToAssign = selectedTeachers;
      
      if (isTeacher && currentTeacherId && !teachersToAssign.includes(currentTeacherId)) {
        teachersToAssign = [...teachersToAssign, currentTeacherId];
      }

      await courseService.createCourse({
        title: formData.title,
        code: formData.code,
        description: formData.description,
        category: formData.category,
        isPublished: formData.isPublished,
        capacity: formData.capacity,
        teachers: teachersToAssign,
      });
      setShowCreateModal(false);
      setFormData({
        title: "",
        code: "",
        description: "",
        category: "",
        isPublished: false,
        capacity: 0,
      });
      setSelectedTeachers([]);
      setCategorySearchTerm("");
      setShowCategoryDropdown(false);
      await fetchCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    
    // For teachers, they are automatically assigned, so we don't need to check selectedTeachers.length
    const hasTeachers = isTeacher ? true : selectedTeachers.length > 0;
    
    if (!formData.category || !hasTeachers) {
      const errorMessage = !formData.category 
        ? "Please select a category" 
        : "Please select at least one teacher";
      alert(errorMessage);
      return;
    }
    
    try {
      await courseService.updateCourse(editingCourse._id, {
        title: formData.title,
        code: formData.code,
        description: formData.description,
        category: formData.category,
        isPublished: formData.isPublished,
        capacity: formData.capacity,
        teachers: selectedTeachers,
      });
      setShowEditModal(false);
      setEditingCourse(null);
      setSelectedTeachers([]);
      setCategorySearchTerm("");
      setShowCategoryDropdown(false);
      await fetchCourses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setContentPaddingLeft(window.innerWidth >= 640 ? 93 : 0);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        className="flex h-screen overflow-hidden relative"
        style={{
          backgroundColor: darkMode ? '#1a202c' : '#f8fafc',
          color: darkMode ? '#ffffff' : '#1e293b'
        }}
      >
      {/* Navigation */}
        <Navbar />

      {/* Sidebar */}
      <Sidebar role={(user?.role as 'admin' | 'teacher' | 'student') || 'student'} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden" style={{ paddingLeft: contentPaddingLeft }}>
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 mt-16">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                >
                  {isStudent ? 'Available Courses' : 'Course Management'}
                </h1>
                <p
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  {isStudent 
                    ? 'Browse and enroll in available courses' 
                    : 'View and manage all courses in the system'
                  }
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-lg text-white flex items-center transition-all duration-200"
                style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5'}
                onClick={fetchCourses}
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 rounded-lg text-white transition-all duration-200"
                style={{ backgroundColor: darkMode ? '#4c1d95' : '#4f46e5' }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#5b21b6' : '#4338ca'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = darkMode ? '#4c1d95' : '#4f46e5'}
              >
                Search
              </button>
              {canCreate && (
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    // If teacher, pre-select themselves using stored ID
                    if (isTeacher && currentTeacherId) {
                      setSelectedTeachers([currentTeacherId]);
                    } else {
                      setSelectedTeachers([]);
                    }
                  }}
                  className="px-6 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: darkMode ? '#059669' : '#10b981',
                    animation: 'pulse 2s infinite'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  + Create Course
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: darkMode ? '#6366f1' : '#4f46e5' }}></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                className="p-4 rounded-lg mb-6 flex items-center"
                style={{
                  backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                  color: darkMode ? '#fca5a5' : '#dc2626'
                }}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Courses Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => (
                  <div
                    key={course._id}
                    className="rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105"
                    style={{
                      backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.8)' : '#ffffff',
                      border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb',
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards',
                      opacity: 0,
                      transform: 'translateY(20px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(99, 102, 241, 0.5)' : '#6366f1';
                      e.currentTarget.style.boxShadow = darkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.borderColor = darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff',
                              color: darkMode ? '#a5b4fc' : '#4f46e5'
                            }}
                          >
                            {course.code}
                          </span>
                          {course.isPublished ? (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                                color: darkMode ? '#6ee7b7' : '#059669'
                              }}
                            >
                              Published
                            </span>
                          ) : (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: darkMode ? 'rgba(156, 163, 175, 0.2)' : '#f3f4f6',
                                color: darkMode ? '#9ca3af' : '#6b7280'
                              }}
                            >
                              Draft
                            </span>
                          )}
                          {isTeacher && canTeacherEditCourse(course) && (
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                                color: darkMode ? '#fbbf24' : '#d97706'
                              }}
                            >
                              Your Course
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-xl font-bold mb-2"
                          style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                        >
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {/* Course Description */}
                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                    >
                      {course.description}
                    </p>

                    {/* Course Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                          {course.category?.name || 'No Category'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                          Capacity: {course.capacity} students
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                          {course.teachers.length} teacher{course.teachers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Teachers List */}
                    {course.teachers.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {course.teachers.map((teacher) => (
                            <span
                              key={teacher._id}
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6',
                                color: darkMode ? '#d1d5db' : '#4b5563'
                              }}
                            >
                              {teacher.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-4 border-t" style={{ borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb' }}>
                      <button
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                        style={{
                          backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff',
                          color: darkMode ? '#a5b4fc' : '#4f46e5'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => openDetail(course)}
                      >
                        {isStudent ? 'View Course' : 'View Details'}
                      </button>
                      {canTeacherEditCourse(course) && (
                        <button
                          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                          style={{
                            backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff',
                            color: darkMode ? '#a5b4fc' : '#4f46e5'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onClick={() => handleEdit(course)}
                        >
                          Edit
                        </button>
                      )}
                      {canTeacherDeleteCourse(course) && (
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                          style={{
                            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                            color: darkMode ? '#fca5a5' : '#dc2626'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onClick={() => handleDelete(course._id)}
                        >
                          Delete
                        </button>
                      )}
                      {isStudent && (
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                          style={{
                            backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                            color: darkMode ? '#6ee7b7' : '#059669'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Enroll
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
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
                >
                  {isStudent ? 'No courses available' : 'No courses found'}
                </h3>
                <p
                  style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}
                >
                  {isStudent 
                    ? 'There are no courses available for enrollment at the moment' 
                    : 'Get started by creating your first course'
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4 transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setCategorySearchTerm("");
              setShowCategoryDropdown(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform shadow-2xl"
            style={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              animation: 'scaleIn 0.3s ease-out',
              border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block mb-2 font-semibold">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Category *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or select category..."
                      value={categorySearchTerm}
                      onChange={(e) => {
                        setCategorySearchTerm(e.target.value);
                        setShowCategoryDropdown(true);
                        // If user types and finds exact match, select it
                        const exactMatch = availableCategories.find(cat => 
                          cat.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (exactMatch) {
                          setFormData({ ...formData, category: exactMatch._id });
                        }
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                      style={{
                        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                        color: darkMode ? '#ffffff' : '#000000',
                      }}
                      required
                    />
                    {showCategoryDropdown && (
                      <div 
                        className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto border rounded transition-colors duration-300"
                        style={{
                          backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.95)' : '#ffffff',
                          borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                        }}
                      >
                        {availableCategories
                          .filter(cat => 
                            cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                          )
                          .map(cat => (
                            <div
                              key={cat._id}
                              className="p-2 cursor-pointer transition-colors duration-200"
                              style={{
                                backgroundColor: formData.category === cat._id ? 
                                  (darkMode ? 'rgba(99, 102, 241, 0.3)' : '#eef2ff') : 'transparent',
                                color: darkMode ? '#ffffff' : '#000000',
                              }}
                              onMouseEnter={(e) => {
                                if (formData.category !== cat._id) {
                                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (formData.category !== cat._id) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                              onClick={() => {
                                setFormData({ ...formData, category: cat._id });
                                setCategorySearchTerm(cat.name);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {cat.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="mr-2"
                  />
                  <label>Published</label>
                </div>
              </div>
              <div>
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
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
                <input
                  type="text"
                  placeholder={isTeacher ? `${user?.username} (You)` : "Search teachers..."}
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  disabled={isTeacher}
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
                />
                <div 
                  className="max-h-40 overflow-y-auto border rounded transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                  }}
                >
                  {(isTeacher ? 
                    // For teachers, only show themselves (get ID from state)
                    availableTeachers.filter(teacher => teacher._id === currentTeacherId) :
                    // For admins, show all teachers with search filter
                    availableTeachers.filter(teacher => 
                      teacher.username.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                      teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
                    )
                  ).map(teacher => (
                      <div 
                        key={teacher._id} 
                        className="flex items-center p-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          backgroundColor: selectedTeachers.includes(teacher._id) ? 
                            (darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff') : 'transparent',
                          borderRadius: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedTeachers.includes(teacher._id)) {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedTeachers.includes(teacher._id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        onClick={() => {
                          if (selectedTeachers.includes(teacher._id)) {
                            setSelectedTeachers(selectedTeachers.filter(id => id !== teacher._id));
                          } else {
                            setSelectedTeachers([...selectedTeachers, teacher._id]);
                          }
                        }}
                      >
                        <div className="mr-3 flex items-center">
                          <div 
                            className="w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center"
                            style={{
                              borderColor: selectedTeachers.includes(teacher._id) ? 
                                (darkMode ? '#a5b4fc' : '#4f46e5') : 
                                (darkMode ? 'rgba(75, 85, 99, 0.5)' : '#d1d5db'),
                              backgroundColor: selectedTeachers.includes(teacher._id) ? 
                                (darkMode ? '#6366f1' : '#4f46e5') : 'transparent',
                            }}
                          >
                            {selectedTeachers.includes(teacher._id) && (
                              <svg 
                                className="w-3 h-3 text-white" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span 
                          className="flex-1 transition-colors duration-200"
                          style={{ 
                            color: selectedTeachers.includes(teacher._id) ? 
                              (darkMode ? '#a5b4fc' : '#4f46e5') : 
                              (darkMode ? '#ffffff' : '#000000')
                          }}
                        >
                          {teacher.username} ({teacher.email})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex space-x-4 col-span-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] p-4 transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setEditingCourse(null);
              setCategorySearchTerm("");
              setShowCategoryDropdown(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform shadow-2xl"
            style={{ 
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              animation: 'scaleIn 0.3s ease-out',
              border: darkMode ? '1px solid rgba(75, 85, 99, 0.3)' : '1px solid #e5e7eb'
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                    style={{
                      backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                      borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                      color: darkMode ? '#ffffff' : '#000000',
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Category *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or select category..."
                      value={categorySearchTerm}
                      onChange={(e) => {
                        setCategorySearchTerm(e.target.value);
                        setShowCategoryDropdown(true);
                        // If user types and finds exact match, select it
                        const exactMatch = availableCategories.find(cat => 
                          cat.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (exactMatch) {
                          setFormData({ ...formData, category: exactMatch._id });
                        }
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                      style={{
                        backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                        borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                        color: darkMode ? '#ffffff' : '#000000',
                      }}
                      required
                    />
                    {showCategoryDropdown && (
                      <div 
                        className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto border rounded transition-colors duration-300"
                        style={{
                          backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.95)' : '#ffffff',
                          borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                        }}
                      >
                        {availableCategories
                          .filter(cat => 
                            cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                          )
                          .map(cat => (
                            <div
                              key={cat._id}
                              className="p-2 cursor-pointer transition-colors duration-200"
                              style={{
                                backgroundColor: formData.category === cat._id ? 
                                  (darkMode ? 'rgba(99, 102, 241, 0.3)' : '#eef2ff') : 'transparent',
                                color: darkMode ? '#ffffff' : '#000000',
                              }}
                              onMouseEnter={(e) => {
                                if (formData.category !== cat._id) {
                                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (formData.category !== cat._id) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                              onClick={() => {
                                setFormData({ ...formData, category: cat._id });
                                setCategorySearchTerm(cat.name);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {cat.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="mr-2"
                  />
                  <label>Published</label>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
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
                <input
                  type="text"
                  placeholder={isTeacher ? `${user?.username} (You)` : "Search teachers..."}
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  disabled={isTeacher}
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                    color: darkMode ? '#ffffff' : '#000000',
                  }}
                />
                <div 
                  className="max-h-40 overflow-y-auto border rounded transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.8)' : '#ffffff',
                    borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : '#e5e7eb',
                  }}
                >
                  {(isTeacher ? 
                    // For teachers, only show themselves (get ID from state)
                    availableTeachers.filter(teacher => teacher._id === currentTeacherId) :
                    // For admins, show all teachers with search filter
                    availableTeachers.filter(teacher => 
                      teacher.username.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                      teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
                    )
                  ).map(teacher => (
                      <div 
                        key={teacher._id} 
                        className="flex items-center p-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          backgroundColor: selectedTeachers.includes(teacher._id) ? 
                            (darkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff') : 'transparent',
                          borderRadius: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedTeachers.includes(teacher._id)) {
                            e.currentTarget.style.backgroundColor = darkMode ? 'rgba(75, 85, 99, 0.3)' : '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedTeachers.includes(teacher._id)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        onClick={() => {
                          if (selectedTeachers.includes(teacher._id)) {
                            setSelectedTeachers(selectedTeachers.filter(id => id !== teacher._id));
                          } else {
                            setSelectedTeachers([...selectedTeachers, teacher._id]);
                          }
                        }}
                      >
                        <div className="mr-3 flex items-center">
                          <div 
                            className="w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center"
                            style={{
                              borderColor: selectedTeachers.includes(teacher._id) ? 
                                (darkMode ? '#a5b4fc' : '#4f46e5') : 
                                (darkMode ? 'rgba(75, 85, 99, 0.5)' : '#d1d5db'),
                              backgroundColor: selectedTeachers.includes(teacher._id) ? 
                                (darkMode ? '#6366f1' : '#4f46e5') : 'transparent',
                            }}
                          >
                            {selectedTeachers.includes(teacher._id) && (
                              <svg 
                                className="w-3 h-3 text-white" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span 
                          className="flex-1 transition-colors duration-200"
                          style={{ 
                            color: selectedTeachers.includes(teacher._id) ? 
                              (darkMode ? '#a5b4fc' : '#4f46e5') : 
                              (darkMode ? '#ffffff' : '#000000')
                          }}
                        >
                          {teacher.username} ({teacher.email})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex items-center col-span-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
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
          className="fixed inset-0 flex items-center justify-center z-[40] p-4 transition-all duration-300"
          onClick={e => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          style={{
            backgroundColor: darkMode ? 'rgba(15,23,42,0.5)' : 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            className={`relative w-full max-w-xl rounded-2xl shadow-2xl px-8 py-6 sm:px-10 sm:py-8 border ${modalAnim === 'enter' ? 'modal-fade-enter' : ''} ${modalAnim === 'leave' ? 'modal-fade-leave' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: darkMode ? '#181F2A' : '#fff',
              color: darkMode ? '#E5E7EB' : '#1e293b',
              border: darkMode ? '1px solid #272B36' : '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-6 text-3xl font-bold focus:outline-none transition-colors"
              aria-label="Close"
              title="Close"
              style={{ zIndex: 41, color: darkMode ? '#a3a3a3' : '#666', background: 'none', border: 'none' }}
            >
              ×
            </button>
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold mr-2 flex-shrink-0">{detailCourse.title}</span>
              <span style={{backgroundColor: darkMode ? '#3730a3':'#eef2ff', color: darkMode ? '#e0e7ff':'#4f46e5', borderRadius: '1rem', fontWeight:'bold', padding:'0.25rem 0.75rem', fontSize: '1rem'}}>{detailCourse.code}</span>
              {detailCourse.isPublished ? (
                <span style={{backgroundColor: darkMode ? '#065f46':'#d1fae5', color: darkMode ? '#6ee7b7':'#059669', fontWeight:'bold', borderRadius:'9999px', fontSize:'0.8rem', padding:'0.18rem 0.75rem'}}>Published</span>
              ) : (
                <span style={{backgroundColor: darkMode ? '#393a3e':'#e5e7eb', color: darkMode ? '#a3a3a3':'#636363', fontWeight:'bold', borderRadius:'9999px', fontSize:'0.8rem', padding:'0.18rem 0.75rem'}}>Draft</span>
              )}
            </div>
            <hr style={{ borderColor: darkMode ? '#2d3748':'#e5e7eb', margin:'.9rem 0'}}/>
            <div className="sm:grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-4">
              <div className="mb-2">
                <div style={{fontSize:'0.75rem', color: darkMode ? '#a3a3a3':'#94a3b8', marginBottom:'0.2rem'}}>Category</div>
                <div className="flex items-center gap-2">
                  <span style={{backgroundColor: darkMode ? '#3730a3':'#dbeafe', color: darkMode ? '#e0e7ff':'#4f46e5', borderRadius: '.6rem', fontSize:'.85rem', fontWeight:'bold', padding:'0.15rem 0.7rem'}}>{detailCourse.category?.name || 'N/A'}</span>
                </div>
                {detailCourse.category?.description && (
                  <div style={{fontSize:'0.75rem', color: darkMode ? '#9ca3af':'#475569', marginTop:'0.3rem', fontStyle:'italic'}}>{detailCourse.category.description}</div>
                )}
              </div>
              <div>
                <div style={{fontSize:'0.75rem', color: darkMode ? '#a3a3a3':'#94a3b8', marginBottom:'0.2rem'}}>Capacity</div>
                <div><span style={{fontWeight:'bold'}}>{detailCourse.capacity}</span> student{detailCourse.capacity !== 1 ? 's' : ''}</div>
              </div>
              <div>
                <div style={{fontSize:'0.75rem', color: darkMode ? '#a3a3a3':'#94a3b8', marginBottom:'0.2rem'}}>Created At</div>
                <div>{detailCourse.createdAt ? new Date(detailCourse.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div>
              </div>
              <div>
                <div style={{fontSize:'0.75rem', color: darkMode ? '#a3a3a3':'#94a3b8', marginBottom:'0.2rem'}}>Last Updated</div>
                <div>{detailCourse.updatedAt ? new Date(detailCourse.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}</div>
              </div>
            </div>
            <hr style={{ borderColor: darkMode ? '#2d3748':'#e5e7eb', margin:'0.7rem 0'}}/>
            <div style={{marginBottom:'1.25rem', marginTop:'1.2rem'}}>
              <div style={{fontWeight:'bold'}}>Description</div>
              <div style={{borderRadius:'0.7rem', background:darkMode?'#232946':'#f1f5f9', color:darkMode?'#e5e7eb':'#374151', padding: '0.6rem 1rem', fontSize:'0.96em', minHeight:40}}>{detailCourse.description || <span style={{fontStyle:'italic', color: darkMode?'#71717a':'#64748b'}}>No description.</span>}</div>
            </div>
            <div style={{marginBottom:'0.8rem', marginTop:'1.1rem'}}>
              <div style={{fontWeight:600, marginBottom:'.6rem'}}>Teachers</div>
              <div style={{display:'flex', flexWrap:'wrap', gap: '1rem'}}>
                {detailCourse.teachers.length > 0 ? detailCourse.teachers.map(t => (
                  <div
                    key={t._id}
                    style={{
                      display:'flex', alignItems:'center',
                      borderRadius: '1.2rem',
                      backgroundColor: darkMode ? '#5b21b6':'#f3e8ff',
                      color: darkMode ? '#f3e8ff':'#5b21b6',
                      border: darkMode ? '1.5px solid #a78bfa':'1.5px solid #c4b5fd',
                      minWidth: 200, maxWidth:'100%', padding: '0.55rem 1.1rem', boxShadow:darkMode?'0 3px 7px #181F2A':'0 1px 5px #ede9fe', fontSize:'0.93em', gap:12
                    }}
                  >
                    <img
                      src={"https://admin.toandz.id.vn/placeholder/img/14.jpg"}
                      alt="avatar"
                      width={48}
                      height={48}
                      style={{ borderRadius: '50%', aspectRatio: '1 / 1', objectFit: 'cover', marginRight: 8, border: darkMode ? '2px solid #a78bfa' : '2px solid #c4b5fd', background: darkMode ? '#232946':'#fff' }}
                    />
                    <div style={{display:'flex', flexDirection:'column', minWidth:0}}>
                      <span style={{fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.username}</span>
                      {t.fullname && <span style={{fontSize:'11px', color:darkMode?'#f3e8ff':'#5b21b6', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.fullname}</span>}
                      <span style={{fontSize:'11px', color:darkMode?'#ddd6fe':'#7c3aed', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.email}</span>
                    </div>
                  </div>
                )) : <span style={{fontStyle:'italic', color:darkMode?'#a3a3a3':'#64748b'}}>No teachers assigned</span>}
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

