import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, MessageSquarePlus, Loader2, Search, ChevronDown, ChevronUp, Check, BookOpen } from "lucide-react";
import { courseService } from "../../services";
import { httpClient } from "../../utils/http";
import Swal from "sweetalert2";
import type { Course } from "../../types/course";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

interface CreateChatGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onChatCreated?: () => void;
}

const CreateChatGroupModal: React.FC<CreateChatGroupModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onChatCreated,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  
  // Custom dropdown states
  const [showCourseDropdown, setShowCourseDropdown] = useState<boolean>(false);
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>("");
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered courses based on search
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery.trim()) return courses;
    const query = courseSearchQuery.toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        (course.code && course.code.toLowerCase().includes(query))
    );
  }, [courses, courseSearchQuery]);

  // Get selected course
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c._id === selectedCourseId);
  }, [courses, selectedCourseId]);

  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const response = await courseService.getMyCourses({ limit: 100 });
      setCourses(response.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load courses",
        background: darkMode ? "#1e293b" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  }, [darkMode]);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen, fetchCourses]);

  const handleCreateGroup = async () => {
    if (!selectedCourseId) {
      Swal.fire({
        icon: "warning",
        title: "Course Required",
        text: "Please select a course for this chat group",
        background: darkMode ? "#1e293b" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      });
      return;
    }

    if (!groupName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name Required",
        text: "Please enter a name for the chat group",
        background: darkMode ? "#1e293b" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      });
      return;
    }

    setIsLoading(true);
    try {
      await httpClient.post("/chat-rooms", {
        courseId: selectedCourseId,
        name: groupName.trim(),
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Chat group created successfully!",
        background: darkMode ? "#1e293b" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form
      setSelectedCourseId("");
      setGroupName("");
      setCourseSearchQuery("");
      onClose();
      onChatCreated?.();
    } catch (error: unknown) {
      console.error("Error creating chat group:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message || "Failed to create chat group";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        background: darkMode ? "#1e293b" : "#ffffff",
        color: darkMode ? "#e5e7eb" : "#0f172a",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCourseId("");
    setGroupName("");
    setCourseSearchQuery("");
    setShowCourseDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: darkMode ? "#334155" : "#e5e7eb",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: darkMode ? "#312e81" : "#eef2ff",
              }}
            >
              <MessageSquarePlus
                className="size-5"
                style={{ color: darkMode ? "#a5b4fc" : "#6366f1" }}
              />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
            >
              Create Chat Group
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-500/20"
            style={{
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Course Selection - Calendar-style dropdown */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: darkMode ? "#cbd5e1" : "#475569" }}
            >
              Select Course <span className="text-red-500">*</span>
            </label>
            
            {isLoadingCourses ? (
              <div
                className="flex items-center justify-center py-3 rounded-lg border"
                style={{
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                }}
              >
                <Loader2 className="size-5 animate-spin text-indigo-500" />
                <span
                  className="ml-2 text-sm"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Loading courses...
                </span>
              </div>
            ) : (
              <div ref={courseDropdownRef} style={{ position: "relative" }}>
                {/* Selected Course Display / Trigger Button */}
                <div
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: `2px solid ${
                      showCourseDropdown
                        ? "#6366f1"
                        : darkMode
                        ? "#334155"
                        : "#e2e8f0"
                    }`,
                    background: darkMode ? "#0f172a" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: showCourseDropdown
                      ? "0 4px 12px rgba(99, 102, 241, 0.15)"
                      : "none",
                  }}
                >
                  {selectedCourse ? (
                    <>
                      {/* Course Icon/Logo */}
                      {selectedCourse.logo ? (
                        <img
                          src={selectedCourse.logo}
                          alt={selectedCourse.title}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "2px solid #6366f1",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: `linear-gradient(135deg, ${
                              COLORS[courses.indexOf(selectedCourse) % COLORS.length]
                            }, ${
                              COLORS[(courses.indexOf(selectedCourse) + 2) % COLORS.length]
                            })`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "11px",
                          }}
                        >
                          {selectedCourse.code?.substring(0, 3) ||
                            selectedCourse.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {selectedCourse.title}
                        </div>
                        {selectedCourse.code && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          >
                            {selectedCourse.code}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: darkMode ? "#374151" : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen
                          className="size-4"
                          style={{ color: darkMode ? "#9ca3af" : "#64748b" }}
                        />
                      </div>
                      <div
                        style={{
                          color: darkMode ? "#9ca3af" : "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        Select a course...
                      </div>
                    </>
                  )}
                  {showCourseDropdown ? (
                    <ChevronUp
                      className="size-5"
                      style={{ color: darkMode ? "#9ca3af" : "#64748b", marginLeft: "auto" }}
                    />
                  ) : (
                    <ChevronDown
                      className="size-5"
                      style={{ color: darkMode ? "#9ca3af" : "#64748b", marginLeft: "auto" }}
                    />
                  )}
                </div>

                {/* Dropdown Menu */}
                {showCourseDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      background: darkMode ? "#1e293b" : "white",
                      borderRadius: "12px",
                      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                      maxHeight: "300px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Search Input */}
                    <div
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: darkMode ? "#0f172a" : "#f1f5f9",
                        }}
                      >
                        <Search
                          className="size-4"
                          style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                        />
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            width: "100%",
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            fontSize: "14px",
                          }}
                        />
                        {courseSearchQuery && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseSearchQuery("");
                            }}
                            style={{
                              padding: "2px",
                              borderRadius: "4px",
                              color: darkMode ? "#64748b" : "#94a3b8",
                              cursor: "pointer",
                              border: "none",
                              background: "transparent",
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Course List */}
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      {filteredCourses.length === 0 ? (
                        <div
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: darkMode ? "#64748b" : "#94a3b8",
                          }}
                        >
                          <BookOpen
                            className="size-8"
                            style={{ margin: "0 auto 8px", opacity: 0.5 }}
                          />
                          <p style={{ fontSize: "13px" }}>No courses found</p>
                        </div>
                      ) : (
                        filteredCourses.map((course, index) => (
                          <div
                            key={course._id}
                            onClick={() => {
                              setSelectedCourseId(course._id);
                              setShowCourseDropdown(false);
                              setCourseSearchQuery("");
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 14px",
                              cursor: "pointer",
                              background:
                                selectedCourseId === course._id
                                  ? darkMode
                                    ? "rgba(99, 102, 241, 0.2)"
                                    : "rgba(99, 102, 241, 0.1)"
                                  : "transparent",
                              borderLeft:
                                selectedCourseId === course._id
                                  ? "3px solid #6366f1"
                                  : "3px solid transparent",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCourseId !== course._id) {
                                e.currentTarget.style.background = darkMode
                                  ? "#334155"
                                  : "#f8fafc";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedCourseId !== course._id) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            {/* Course Logo */}
                            {course.logo ? (
                              <img
                                src={course.logo}
                                alt={course.title}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                  border:
                                    selectedCourseId === course._id
                                      ? "2px solid #6366f1"
                                      : `2px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: `linear-gradient(135deg, ${
                                    COLORS[index % COLORS.length]
                                  }, ${COLORS[(index + 2) % COLORS.length]})`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: "11px",
                                }}
                              >
                                {course.code?.substring(0, 3) ||
                                  course.title.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 500,
                                  fontSize: "13px",
                                  color: darkMode ? "#f1f5f9" : "#1e293b",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {course.title}
                              </div>
                              {course.code && (
                                <div
                                  style={{
                                    fontSize: "11px",
                                    marginTop: "2px",
                                  }}
                                >
                                  <span
                                    style={{
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      background: darkMode ? "#374151" : "#e2e8f0",
                                      color: darkMode ? "#94a3b8" : "#64748b",
                                    }}
                                  >
                                    {course.code}
                                  </span>
                                </div>
                              )}
                            </div>
                            {selectedCourseId === course._id && (
                              <Check
                                className="size-5"
                                style={{ color: "#6366f1" }}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: darkMode ? "#cbd5e1" : "#475569" }}
            >
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              style={{
                backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                color: darkMode ? "#f1f5f9" : "#0f172a",
              }}
            />
            <p
              className="text-xs"
              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
            >
              {groupName.length}/100 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            backgroundColor: darkMode ? "#0f172a50" : "#f8fafc",
          }}
        >
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: darkMode ? "#334155" : "#e5e7eb",
              color: darkMode ? "#e5e7eb" : "#475569",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isLoading || !selectedCourseId || !groupName.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                isLoading || !selectedCourseId || !groupName.trim()
                  ? "#6366f180"
                  : "#6366f1",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquarePlus className="size-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChatGroupModal;
